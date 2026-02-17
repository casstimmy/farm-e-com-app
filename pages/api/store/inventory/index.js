import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import InventoryCategory from "@/models/InventoryCategory";

/**
 * Public Inventory Products API
 * GET /api/store/inventory
 *
 * Lists inventory items marked as showOnSite with quantity > 0.
 * Supports category filtering, search, sorting.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const {
      category,
      search,
      sort = "newest",
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      showOnSite: true,
      quantity: { $gt: 0 },
    };

    if (category) {
      filter.categoryId = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { item: searchRegex },
        { category: searchRegex },
        { categoryName: searchRegex },
      ];
    }

    if (minPrice || maxPrice) {
      filter.salesPrice = {};
      if (minPrice) filter.salesPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.salesPrice.$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { salesPrice: 1 },
      price_desc: { salesPrice: -1 },
      name_asc: { item: 1 },
    };

    const sortOption = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [items, totalCount, categories] = await Promise.all([
      Inventory.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(perPage)
        .populate("categoryId", "name description")
        .select("-costPrice -marginPercent -totalConsumed -minStock -medication")
        .lean(),
      Inventory.countDocuments(filter),
      InventoryCategory.find().sort({ name: 1 }).lean(),
    ]);

    // Count items per category (for sidebar)
    const categoryCounts = await Inventory.aggregate([
      { $match: { showOnSite: true, quantity: { $gt: 0 } } },
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 },
          categoryName: { $first: "$categoryName" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );

    res.status(200).json({
      items,
      categories: categoryCounts.map((c) => ({
        _id: c._id,
        name: c.categoryName || "Uncategorized",
        count: c.count,
      })),
      pagination: {
        page: pageNum,
        limit: perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
        hasMore: pageNum * perPage < totalCount,
      },
    });
  } catch (error) {
    console.error("Inventory products API error:", error);
    res.status(500).json({ error: "Failed to fetch inventory products" });
  }
}
