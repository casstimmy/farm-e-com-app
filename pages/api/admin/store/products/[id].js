import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import StoreCategory from "@/models/StoreCategory";
import { withAdminAuth } from "@/utils/adminAuth";

/**
 * Admin single product management endpoint.
 * GET    /api/admin/store/products/[id] — Get product detail
 * PUT    /api/admin/store/products/[id] — Update product
 * DELETE /api/admin/store/products/[id] — Delete product
 */
async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const product = await Product.findById(id)
        .populate("storeCategory", "name slug");

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updates = req.body;
      const oldCategoryId = product.storeCategory?.toString();

      if (updates.name && updates.name !== product.name) {
        let newSlug = updates.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const existingSlug = await Product.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });
        if (existingSlug) {
          newSlug = `${newSlug}-${Date.now().toString(36)}`;
        }
        updates.slug = newSlug;
      }

      const allowedFields = [
        "name", "slug", "description", "shortDescription",
        "storeCategory", "productType", "images", "price",
        "compareAtPrice", "costPrice", "unit", "trackInventory", "stockQuantity",
        "lowStockThreshold", "isFeatured", "isActive", "tags", "weight",
        "weightUnit", "sku",
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          if (field === "tags" && Array.isArray(updates[field])) {
            product[field] = updates[field].map((t) => t.toLowerCase().trim()).filter(Boolean);
          } else {
            product[field] = updates[field];
          }
        }
      }

      await product.save();

      const newCategoryId = product.storeCategory?.toString();
      const categoriesToUpdate = new Set();
      if (oldCategoryId) categoriesToUpdate.add(oldCategoryId);
      if (newCategoryId) categoriesToUpdate.add(newCategoryId);

      for (const catId of categoriesToUpdate) {
        const count = await Product.countDocuments({
          storeCategory: catId,
          isActive: true,
        });
        await StoreCategory.findByIdAndUpdate(catId, { productCount: count });
      }

      const populated = await Product.findById(id)
        .populate("storeCategory", "name slug");

      res.status(200).json(populated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: SuperAdmin only" });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const categoryId = product.storeCategory?.toString();
      await Product.findByIdAndDelete(id);

      if (categoryId) {
        const count = await Product.countDocuments({
          storeCategory: categoryId,
          isActive: true,
        });
        await StoreCategory.findByIdAndUpdate(categoryId, { productCount: count });
      }

      res.status(200).json({ message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAdminAuth(handler);
