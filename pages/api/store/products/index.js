import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Public product listing endpoint.
 * GET /api/store/products
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const {
      category,
      search,
      featured,
      sort = "newest",
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      tag,
    } = req.query;

    const filter = { isActive: true };

    if (category) {
      filter.storeCategory = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (tag) {
      filter.tags = { $in: [tag.toLowerCase()] };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    let query;
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
      query = Product.find(filter, { score: { $meta: "textScore" } });

      if (sort === "relevance" || !sort) {
        query = query.sort({ score: { $meta: "textScore" } });
      }
    } else {
      query = Product.find(filter);
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      popular: { salesCount: -1 },
      name_asc: { name: 1 },
    };

    if (sort !== "relevance" && sortMap[sort]) {
      query = query.sort(sortMap[sort]);
    } else if (!search) {
      query = query.sort(sortMap.newest);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [products, totalCount] = await Promise.all([
      query
        .skip(skip)
        .limit(perPage)
        .populate("storeCategory", "name slug")
        .select("-costPrice")
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      pagination: {
        page: pageNum,
        limit: perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
        hasMore: pageNum * perPage < totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-products-list",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 180,
  },
  handler
);
