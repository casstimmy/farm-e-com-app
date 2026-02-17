import Product from "@/models/Product";
import Order from "@/models/Order";
import Inventory from "@/models/Inventory";
import Finance from "@/models/Finance";

/**
 * Inventory Synchronization Service
 *
 * Both Web_Place and farm-health-app share the same MongoDB database.
 * This service directly reads/writes the Inventory and Finance
 * collections — no REST API dependency.
 */

/**
 * Deduct inventory for a paid order.
 * - Directly decrements Inventory.quantity in the shared database
 * - Updates local Product stockQuantity cache
 * - Marks order.inventoryDeducted = true
 */
export async function deductInventoryForOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.inventoryDeducted) return { success: true, errors: [] };

  const errors = [];

  for (const item of order.items) {
    if (!item.inventoryItem) continue;

    try {
      const inv = await Inventory.findById(item.inventoryItem);
      if (!inv) {
        errors.push({ product: item.name, reason: "Inventory item not found" });
        continue;
      }

      const newQty = Math.max(0, inv.quantity - item.quantity);
      inv.quantity = newQty;
      inv.totalConsumed = (inv.totalConsumed || 0) + item.quantity;
      await inv.save();

      // Update local Product stock cache
      await Product.updateMany(
        { inventoryItem: item.inventoryItem },
        { $set: { stockQuantity: newQty } }
      );
    } catch (err) {
      errors.push({ product: item.name, reason: err.message });
    }
  }

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

  for (const item of order.items) {
    if (!item.inventoryItem) continue;

    try {
      const inv = await Inventory.findById(item.inventoryItem);
      if (!inv) continue;

      inv.quantity += item.quantity;
      inv.totalConsumed = Math.max(0, (inv.totalConsumed || 0) - item.quantity);
      await inv.save();

      // Update local Product stock cache
      await Product.updateMany(
        { inventoryItem: item.inventoryItem },
        { $set: { stockQuantity: inv.quantity } }
      );
    } catch (err) {
      console.error(`Restore stock error for ${item.name}:`, err.message);
    }
  }

  order.inventoryDeducted = false;
  await order.save();
}

/**
 * Create a Finance Income record for a completed order
 * directly in the shared Finance collection.
 */
export async function createSalesFinanceRecord(order) {
  if (order.financeRecordId) return null;

  const costOfGoods = order.items.reduce(
    (sum, item) => sum + (item.costPrice || 0) * item.quantity,
    0
  );

  try {
    const financeRecord = await Finance.create({
      date: order.paidAt || new Date(),
      type: "Income",
      category: "Store Sales",
      title: `Online Order #${order.orderNumber}`,
      description: `${order.items.length} item(s) — ${order.customerName} (${order.customerEmail})`,
      amount: order.total,
      paymentMethod: order.paymentMethod === "paystack" ? "Bank Transfer" : "Cash",
      status: "Completed",
      notes: `Subtotal: ${order.subtotal}, Shipping: ${order.shippingCost || 0}, COGS: ${costOfGoods}`,
    });

    await Order.findByIdAndUpdate(order._id, {
      financeRecordId: financeRecord._id,
    });

    return { financeRecordId: financeRecord._id };
  } catch (err) {
    console.error("Create finance record error:", err.message);
    return null;
  }
}

/**
 * Sync a single Product's stockQuantity from the Inventory collection.
 */
export async function syncProductStock(inventoryItemId, newQuantity) {
  if (!inventoryItemId) return;
  await Product.updateMany(
    { inventoryItem: inventoryItemId },
    { $set: { stockQuantity: Math.max(0, newQuantity) } }
  );
}
