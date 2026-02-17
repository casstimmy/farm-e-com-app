import dbConnect from "@/lib/mongodb";
import StoreCategory from "@/models/StoreCategory";
import Product from "@/models/Product";
import { withAdminAuth } from "@/utils/adminAuth";

/**
 * Admin single store category endpoint.
 * PUT    /api/admin/store/categories/[id] — Update category
 * DELETE /api/admin/store/categories/[id] — Delete category
 */
async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const category = await StoreCategory.findById(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const { name, description, image, parent, sortOrder, isActive } = req.body;

      if (name && name !== category.name) {
        category.name = name.trim();
        let newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const existingSlug = await StoreCategory.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });
        if (existingSlug) {
          newSlug = `${newSlug}-${Date.now().toString(36)}`;
        }
        category.slug = newSlug;
      }

      if (description !== undefined) category.description = description;
      if (image !== undefined) category.image = image;
      if (parent !== undefined) category.parent = parent || null;
      if (sortOrder !== undefined) category.sortOrder = sortOrder;
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: SuperAdmin only" });
      }

      const category = await StoreCategory.findById(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const productCount = await Product.countDocuments({ storeCategory: id });
      if (productCount > 0) {
        return res.status(400).json({
          error: `Cannot delete: ${productCount} product(s) are assigned to this category. Reassign them first.`,
        });
      }

      const childCount = await StoreCategory.countDocuments({ parent: id });
      if (childCount > 0) {
        return res.status(400).json({
          error: `Cannot delete: ${childCount} sub-category/ies reference this category.`,
        });
      }

      await StoreCategory.findByIdAndDelete(id);
      res.status(200).json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAdminAuth(handler);
