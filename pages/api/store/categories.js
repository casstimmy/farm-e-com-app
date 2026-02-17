import dbConnect from "@/lib/mongodb";
import StoreCategory from "@/models/StoreCategory";

/**
 * Public store categories endpoint.
 * GET /api/store/categories
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const categories = await StoreCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate("parent", "name slug")
      .lean();

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}
