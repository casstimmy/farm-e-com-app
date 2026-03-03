import dbConnect from "@/lib/mongodb";
import BlogPost from "@/models/BlogPost";
import { withAdminAuth } from "@/utils/adminAuth";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Admin Blog Posts API
 * GET /api/admin/store/blog - List blog posts
 * POST /api/admin/store/blog - Create blog post
 */
async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { status = "all", sort = "latest", page = 1, limit = 10, search = "" } = req.query;

      const filter = {};
      if (status !== "all") {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      const sortMap = {
        latest: { publishedAt: -1, createdAt: -1 },
        oldest: { publishedAt: 1 },
        alphabetical: { title: 1 },
        featured: { isFeatured: -1, publishedAt: -1 },
      };

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * perPage;

      const [posts, totalCount] = await Promise.all([
        BlogPost.find(filter)
          .sort(sortMap[sort] || sortMap.latest)
          .skip(skip)
          .limit(perPage)
          .select("-content")
          .lean(),
        BlogPost.countDocuments(filter),
      ]);

      return res.status(200).json({
        posts,
        pagination: {
          page: pageNum,
          limit: perPage,
          totalCount,
          totalPages: Math.ceil(totalCount / perPage),
        },
      });
    } catch (error) {
      console.error("Blog list error:", error);
      return res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, excerpt, content, coverImage, category, tags, status, isFeatured, seoDescription, seoKeywords } = req.body;

      if (!title || title.trim().length < 5) {
        return res.status(400).json({ error: "Title must be at least 5 characters" });
      }

      if (!content || content.trim().length < 50) {
        return res.status(400).json({ error: "Content must be at least 50 characters" });
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if slug already exists
      const existing = await BlogPost.findOne({ slug });
      if (existing) {
        return res.status(400).json({ error: "A post with this title already exists" });
      }

      const post = new BlogPost({
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || "",
        content: content.trim(),
        coverImage: coverImage || "",
        category: category || "General",
        tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        status: status || "Draft",
        isFeatured: isFeatured || false,
        seoDescription: seoDescription?.trim() || excerpt?.substring(0, 160) || "",
        seoKeywords: seoKeywords ? seoKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) : [],
      });

      await post.save();

      return res.status(201).json({
        message: "Blog post created successfully",
        post,
      });
    } catch (error) {
      console.error("Blog create error:", error);
      return res.status(500).json({ error: error.message || "Failed to create blog post" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRateLimit(
  {
    keyPrefix: "admin-blog-list",
    methods: ["GET", "POST"],
    windowMs: 60 * 1000,
    max: 100,
  },
  withAdminAuth(handler)
);
