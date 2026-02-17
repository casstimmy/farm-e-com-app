import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";
import { withAdminAuth } from "@/utils/adminAuth";

/**
 * Admin inventory sync endpoint.
 * POST /api/admin/store/sync-inventory
 *
 * Reads current stock levels directly from the shared Inventory collection
 * and updates Web_Place Product stockQuantity accordingly.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Find all products that track inventory (linked to an Inventory item)
    const products = await Product.find({
      inventoryItem: { $exists: true, $ne: null },
    });

    if (products.length === 0) {
      return res.status(200).json({
        message: "No inventory-linked products found",
        updatedCount: 0,
      });
    }

    // Get all linked inventory item IDs
    const inventoryIds = products.map((p) => p.inventoryItem);
    const inventoryItems = await Inventory.find({ _id: { $in: inventoryIds } }).lean();

    // Build lookup map
    const inventoryMap = {};
    for (const item of inventoryItems) {
      inventoryMap[item._id.toString()] = item;
    }

    // Sync stock quantities
    let updatedCount = 0;
    for (const product of products) {
      const invItem = inventoryMap[product.inventoryItem.toString()];
      if (invItem && product.stockQuantity !== invItem.quantity) {
        product.stockQuantity = invItem.quantity;
        await product.save();
        updatedCount++;
      }
    }

    res.status(200).json({
      message: `Stock synchronized for ${updatedCount} product(s)`,
      updatedCount,
      totalChecked: products.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default withAdminAuth(handler);
