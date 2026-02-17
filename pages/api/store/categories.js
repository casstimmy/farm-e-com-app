import dbConnect from "@/lib/mongodb";
import StoreCategory from "@/models/StoreCategory";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Public store categories endpoint.
 * GET /api/store/categories
 */
async function handler(req, res) {
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

export default withRateLimit(
  {
    keyPrefix: "store-categories",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 240,
  },
  handler
);
