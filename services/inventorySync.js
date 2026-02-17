import Product from "@/models/Product";
import Order from "@/models/Order";
import { deductStock, restoreStock, registerSale } from "@/lib/farmApi";

/**
 * Inventory Synchronization Service
 *
 * In the standalone Web_Place architecture, this service communicates
 * with the farm-health-app via REST API for all inventory and finance
 * operations. Product.stockQuantity is the local cache; the farm
 * Inventory model remains the source of truth.
 */

/**
 * Deduct inventory for a paid order.
 * - Calls the farm-health-app REST API to deduct stock
 * - Updates local Product stockQuantity
 * - Marks order.inventoryDeducted = true
 */
export async function deductInventoryForOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.inventoryDeducted) return { success: true, errors: [] };

  // Build deduction items for the farm API
  const deductionItems = order.items
    .filter((item) => item.inventoryItem)
    .map((item) => ({
      inventoryItemId: item.inventoryItem.toString(),
      quantity: item.quantity,
      productName: item.name,
    }));

  let errors = [];

  if (deductionItems.length > 0) {
    try {
      const result = await deductStock(deductionItems);
      errors = result.errors || [];
    } catch (err) {
      console.error("Farm API deduct-stock error:", err.message);
      errors.push({ product: "API", reason: err.message });
    }
  }

  // Update local product stock cache
  for (const item of order.items) {
    if (!item.inventoryItem) continue;
    await Product.updateMany(
      { inventoryItem: item.inventoryItem },
      { $inc: { stockQuantity: -item.quantity } }
    );
  }

  // Ensure no negative stock locally
  await Product.updateMany(
    { stockQuantity: { $lt: 0 } },
    { $set: { stockQuantity: 0 } }
  );

  if (errors.length === 0) {
    order.inventoryDeducted = true;
    await order.save();
  }

  return { success: errors.length === 0, errors };
}

/**
 * Restore inventory for a cancelled order.
 */
export async function restoreInventoryForOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  if (!order.inventoryDeducted) return;

  const restoreItems = order.items
    .filter((item) => item.inventoryItem)
    .map((item) => ({
      inventoryItemId: item.inventoryItem.toString(),
      quantity: item.quantity,
      productName: item.name,
    }));

  if (restoreItems.length > 0) {
    try {
      await restoreStock(restoreItems);
    } catch (err) {
      console.error("Farm API restore-stock error:", err.message);
    }
  }

  // Update local product stock cache
  for (const item of order.items) {
    if (!item.inventoryItem) continue;
    await Product.updateMany(
      { inventoryItem: item.inventoryItem },
      { $inc: { stockQuantity: item.quantity } }
    );
  }

  order.inventoryDeducted = false;
  await order.save();
}

/**
 * Create a Finance Income record for a completed order
 * by calling the farm-health-app REST API.
 */
export async function createSalesFinanceRecord(order) {
  if (order.financeRecordId) return null;

  const costOfGoods = order.items.reduce(
    (sum, item) => sum + item.costPrice * item.quantity,
    0
  );

  try {
    const result = await registerSale({
      orderNumber: order.orderNumber,
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      costOfGoods,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      itemCount: order.items.length,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt || new Date(),
    });

    if (result.financeRecordId) {
      await Order.findByIdAndUpdate(order._id, {
        financeRecordId: result.financeRecordId,
      });
    }

    return result;
  } catch (err) {
    console.error("Farm API register-sale error:", err.message);
    return null;
  }
}

/**
 * Sync a single Product's stockQuantity from the farm inventory system.
 * This is a lightweight local-only update used after admin operations.
 */
export async function syncProductStock(inventoryItemId, newQuantity) {
  if (!inventoryItemId) return;
  await Product.updateMany(
    { inventoryItem: inventoryItemId },
    { $set: { stockQuantity: Math.max(0, newQuantity) } }
  );
}
