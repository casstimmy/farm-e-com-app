import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";

/**
 * Public Services API
 * GET /api/store/services
 *
 * Lists services marked as showOnSite and isActive.
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
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
    };

    const sortOption = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [services, totalCount] = await Promise.all([
      Service.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(perPage)
        .lean(),
      Service.countDocuments(filter),
    ]);

    // Get category counts for sidebar
    const categoryCounts = await Service.aggregate([
      { $match: { showOnSite: true, isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      services,
      categories: categoryCounts.map((c) => ({
        name: c._id,
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
    console.error("Services API error:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
}
