import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import {
  deductInventoryForOrder,
  restoreInventoryForOrder,
  createSalesFinanceRecord,
} from "./inventorySync";
import {
  sendOrderConfirmationEmail,
  sendShipmentNotificationEmail,
  sendDeliveryConfirmationEmail,
} from "./emailService";

/**
 * Order Service
 *
 * Encapsulates all order lifecycle logic: creation, payment confirmation,
 * status transitions, cancellation, and aggregation queries.
 */

/**
 * Validate cart items against current product availability and pricing.
 */
export async function validateCartForCheckout(cartItems) {
  const errors = [];
  const resolvedItems = [];

  // Batch-fetch all products at once to avoid N+1 queries
  const productIds = cartItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const cartItem of cartItems) {
    const product = productMap.get(cartItem.product.toString());

    if (!product || !product.isActive) {
      errors.push({ product: cartItem.product, reason: "Product not available" });
      continue;
    }

    if (product.trackInventory && product.stockQuantity < cartItem.quantity) {
      errors.push({
        product: product.name,
        reason: `Only ${product.stockQuantity} available`,
        available: product.stockQuantity,
      });
      continue;
    }

    resolvedItems.push({
      product: product._id,
      inventoryItem: product.inventoryItem || null,
      name: product.name,
      slug: product.slug,
      image: product.images?.find((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url || "",
      price: product.price,
      costPrice: product.costPrice || 0,
      quantity: cartItem.quantity,
      lineTotal: product.price * cartItem.quantity,
      unit: product.unit,
    });
  }

  return { valid: errors.length === 0, items: resolvedItems, errors };
}

/**
 * Create an order from a validated cart.
 */
export async function createOrder({
  customerId,
  items,
  shippingAddress,
  paymentMethod = "Paystack",
  notes = "",
  shippingCost = 0,
}) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal + shippingCost;

  const order = new Order({
    customer: customerId,
    items,
    subtotal,
    shippingCost,
    total,
    shippingAddress,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email,
    customerPhone: customer.phone || "",
    paymentMethod,
    notes,
    statusHistory: [{ status: "Pending", changedAt: new Date() }],
  });

  await order.save();

  // Clear customer cart
  await Cart.deleteOne({ customer: customerId });

  return order;
}

/**
 * Process a successful payment for an order.
 */
export async function confirmOrderPayment(orderId) {
  const order = await Order.findById(orderId).populate("customer");
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === "Paid") return order;

  order.status = "Paid";
  order.paymentStatus = "Paid";
  order.paidAt = new Date();
  await order.save();

  // Deduct inventory via farm-health-app REST API
  const { errors } = await deductInventoryForOrder(orderId);
  if (errors.length > 0) {
    order.adminNotes = `Inventory deduction issues: ${errors.map((e) => `${e.product}: ${e.reason}`).join("; ")}`;
    await order.save();
  }

  // Create finance record via farm-health-app REST API
  await createSalesFinanceRecord(order);

  // Update customer stats
  await Customer.findByIdAndUpdate(order.customer._id, {
    $inc: { orderCount: 1, totalSpent: order.total },
  });

  // Batch-increment product sales counters
  const bulkOps = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { salesCount: item.quantity } },
    },
  }));
  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
  }

  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail(order.toObject(), order.customer);
  } catch (emailError) {
    console.error("Failed to send order confirmation email:", emailError);
    // Don't fail the entire process if email fails
  }

  return order;
}

/**
 * Update order status with validation of allowed transitions.
 */
const ALLOWED_TRANSITIONS = {
  Pending: ["Paid", "Cancelled"],
  Paid: ["Processing", "Cancelled", "Refunded"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
  Refunded: [],
};

export async function updateOrderStatus(orderId, newStatus, { note, changedBy } = {}) {
  const order = await Order.findById(orderId).populate("customer");
  if (!order) throw new Error("Order not found");

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition from "${order.status}" to "${newStatus}"`
    );
  }

  order.status = newStatus;

  if (note || changedBy) {
    const lastEntry = order.statusHistory[order.statusHistory.length - 1];
    if (lastEntry && lastEntry.status === newStatus) {
      lastEntry.note = note;
      lastEntry.changedBy = changedBy;
    }
  }

  if (newStatus === "Cancelled") {
    order.cancellationReason = note || "";
    if (order.inventoryDeducted) {
      await restoreInventoryForOrder(orderId);
    }
  }

  await order.save();

  // Send status update emails
  try {
    if (newStatus === "Shipped") {
      await sendShipmentNotificationEmail(order.toObject(), order.customer, {
        trackingNumber: note || "To be provided",
        estimatedDelivery: "3-5 business days",
      });
    } else if (newStatus === "Delivered") {
      await sendDeliveryConfirmationEmail(order.toObject(), order.customer);
    }
  } catch (emailError) {
    console.error("Failed to send status update email:", emailError);
  }

  return order;
}

/**
 * Get order summary statistics for the admin dashboard.
 */
export async function getOrderStats(dateFrom = null) {
  const match = {};
  if (dateFrom) {
    match.createdAt = { $gte: new Date(dateFrom) };
  }

  const [stats] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $in: ["$paymentStatus", ["Paid"]] },
              "$total",
              0,
            ],
          },
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
        },
        processingOrders: {
          $sum: {
            $cond: [
              { $in: ["$status", ["Paid", "Processing"]] },
              1,
              0,
            ],
          },
        },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0] },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
        },
        avgOrderValue: { $avg: "$total" },
      },
    },
  ]);

  return (
    stats || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      avgOrderValue: 0,
    }
  );
}
