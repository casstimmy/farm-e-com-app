import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Single Inventory Item Detail API
 * GET /api/store/inventory/[id]
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid item ID" });
  }

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

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    res.status(200).json({ item, relatedItems });
  } catch (error) {
    console.error("Inventory detail error:", error);
    res.status(500).json({ error: "Failed to fetch item details" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-inventory-detail",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 240,
  },
  handler
);
