import dbConnect from "@/lib/mongodb";
import BlogPost from "@/models/BlogPost";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Public Blog API
 * GET /api/store/blog - Get published blog posts
 * GET /api/store/blog?slug=xxx - Get blog post by slug
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const { slug, category, featured = "false", page = 1, limit = 10, sort = "latest" } = req.query;

    // If slug is provided, fetch single post
    if (slug) {
      const post = await BlogPost.findOne({
        slug,
        status: "Published",
        showOnSite: true,
      });

      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      // Increment view count
      post.views = (post.views || 0) + 1;
      await post.save();

      // Set cache headers
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

      return res.status(200).json(post);
    }

    // Build filter for list
    const filter = {
      status: "Published",
      showOnSite: true,
    };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    // Sort options
    const sortMap = {
      latest: { publishedAt: -1 },
      oldest: { publishedAt: 1 },
      trending: { views: -1, publishedAt: -1 },
      featured: { isFeatured: -1, publishedAt: -1 },
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * perPage;

    const [posts, totalCount, categories] = await Promise.all([
      BlogPost.find(filter)
        .sort(sortMap[sort] || sortMap.latest)
        .skip(skip)
        .limit(perPage)
        .select("-content")
        .lean(),
      BlogPost.countDocuments(filter),
      BlogPost.aggregate([
        {
          $match: {
            status: "Published",
            showOnSite: true,
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Set public cache headers
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return res.status(200).json({
      posts,
      categories: categories.map((c) => ({
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
    console.error("Blog API error:", error);
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-blog-list",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 300,
  },
  handler
);
