import dbConnect from "@/lib/mongodb";
import BlogPost from "@/models/BlogPost";
import { withAdminAuth } from "@/utils/adminAuth";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Admin Blog Post Detail API
 * GET /api/admin/store/blog/[id] - Get single blog post
 * PUT /api/admin/store/blog/[id] - Update blog post
 * DELETE /api/admin/store/blog/[id] - Delete blog post
 */
async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (!id || id.length !== 24) {
    return res.status(400).json({ error: "Invalid blog post ID" });
  }

  if (req.method === "GET") {
    try {
      const post = await BlogPost.findById(id);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      return res.status(200).json(post);
    } catch (error) {
      console.error("Blog get error:", error);
      return res.status(500).json({ error: "Failed to fetch blog post" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { title, excerpt, content, coverImage, category, tags, status, isFeatured, seoDescription, seoKeywords } = req.body;

      const post = await BlogPost.findById(id);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      // Update fields
      if (title) {
        post.title = title.trim();
        // Regenerate slug if title changed
        if (post.title !== title) {
          const newSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_]+/g, "-")
            .replace(/^-+|-+$/g, "");

          // Check if new slug already exists (excluding current post)
          const existing = await BlogPost.findOne({ slug: newSlug, _id: { $ne: id } });
          if (existing) {
            return res.status(400).json({ error: "A post with this title already exists" });
          }
          post.slug = newSlug;
        }
      }

      if (excerpt !== undefined) post.excerpt = excerpt.trim();
      if (content) post.content = content.trim();
      if (coverImage !== undefined) post.coverImage = coverImage;
      if (category) post.category = category;
      if (tags) {
        post.tags = tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      }
      if (status) post.status = status;
      if (isFeatured !== undefined) post.isFeatured = isFeatured;
      if (seoDescription !== undefined) post.seoDescription = seoDescription.trim();
      if (seoKeywords) {
        post.seoKeywords = seoKeywords
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
      }

      await post.save();

      return res.status(200).json({
        message: "Blog post updated successfully",
        post,
      });
    } catch (error) {
      console.error("Blog update error:", error);
      return res.status(500).json({ error: error.message || "Failed to update blog post" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const post = await BlogPost.findByIdAndDelete(id);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      return res.status(200).json({
        message: "Blog post deleted successfully",
      });
    } catch (error) {
      console.error("Blog delete error:", error);
      return res.status(500).json({ error: "Failed to delete blog post" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRateLimit(
  {
    keyPrefix: "admin-blog-detail",
    methods: ["GET", "PUT", "DELETE"],
    windowMs: 60 * 1000,
    max: 100,
  },
  withAdminAuth(handler)
);
