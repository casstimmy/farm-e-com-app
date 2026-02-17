import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import { withAdminAuth } from "@/utils/adminAuth";
import { fetchPublicProducts } from "@/lib/farmApi";

/**
 * Admin inventory sync endpoint.
 * POST /api/admin/store/sync-inventory
 *
 * Fetches current stock levels from farm-health-app and updates
 * Web_Place Product stockQuantity accordingly.
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

    // Fetch inventory data from farm-health-app
    let farmProducts = [];
    try {
      const result = await fetchPublicProducts({ limit: 1000 });
      farmProducts = result.products || result || [];
    } catch (err) {
      console.warn("Could not fetch from farm API, syncing locally only:", err.message);
    }

    // Update local products that have matching inventory items
    let updatedCount = 0;
    const products = await Product.find({ trackInventory: true });

    for (const product of products) {
      // Match by inventoryItem reference if it exists
      if (product.inventoryItem) {
        const farmItem = farmProducts.find(
          (fp) => fp.inventoryItemId === product.inventoryItem.toString()
        );
        if (farmItem && farmItem.stockQuantity !== undefined) {
          product.stockQuantity = farmItem.stockQuantity;
          await product.save();
          updatedCount++;
        }
      }
    }

    res.status(200).json({
      message: `Stock synchronized for ${updatedCount} product(s)`,
      updatedCount,
      farmProductsCount: farmProducts.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default withAdminAuth(handler);
