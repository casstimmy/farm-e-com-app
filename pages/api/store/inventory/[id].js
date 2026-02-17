import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";

/**
 * Single Inventory Item Detail
 * GET /api/store/inventory/[id]
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  await dbConnect();

  try {
    const item = await Inventory.findOne({
      _id: id,
      showOnSite: true,
    })
      .populate("categoryId", "name description")
      .select("-costPrice -marginPercent -totalConsumed -minStock -medication")
      .lean();

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Related items from same category
    const relatedItems = await Inventory.find({
      _id: { $ne: item._id },
      showOnSite: true,
      quantity: { $gt: 0 },
      categoryId: item.categoryId?._id || item.categoryId,
    })
      .limit(4)
      .select("item salesPrice quantity unit categoryName")
      .lean();

    res.status(200).json({ item, relatedItems });
  } catch (error) {
    console.error("Inventory detail error:", error);
    res.status(500).json({ error: "Failed to fetch item details" });
  }
}
