import dbConnect from "@/lib/mongodb";
import StoreCategory from "@/models/StoreCategory";
import Product from "@/models/Product";
import { withAdminAuth } from "@/utils/adminAuth";

/**
 * Admin store category management endpoint.
 * GET  /api/admin/store/categories — List all categories
 * POST /api/admin/store/categories — Create category
 */
async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const categories = await StoreCategory.find()
        .sort({ sortOrder: 1, name: 1 })
        .populate("parent", "name slug")
        .lean();

      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { name, description, image, parent, sortOrder = 0 } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }

      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const existing = await StoreCategory.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const category = await StoreCategory.create({
        name: name.trim(),
        slug,
        description: description || "",
        image: image || "",
        parent: parent || null,
        sortOrder,
      });

      res.status(201).json(category);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: "Category name already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAdminAuth(handler);
