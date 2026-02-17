import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import StoreCategory from "@/models/StoreCategory";
import { withAdminAuth } from "@/utils/adminAuth";

/**
 * Admin product management endpoint.
 * GET  /api/admin/store/products — List all products
 * POST /api/admin/store/products — Create a new product
 */
async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { category, active, search, page = 1, limit = 50 } = req.query;

      const filter = {};
      if (category) filter.storeCategory = category;
      if (active === "true") filter.isActive = true;
      if (active === "false") filter.isActive = false;
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * perPage;

      const [products, totalCount] = await Promise.all([
        Product.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPage)
          .populate("storeCategory", "name slug")
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
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const {
        name,
        description,
        shortDescription,
        storeCategoryId,
        productType = "physical",
        images = [],
        price,
        compareAtPrice,
        costPrice = 0,
        unit = "Unit",
        trackInventory = true,
        stockQuantity = 0,
        isFeatured = false,
        tags = [],
        weight = 0,
        weightUnit = "kg",
        sku = "",
        lowStockThreshold = 5,
      } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const existing = await Product.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const product = await Product.create({
        name,
        slug,
        description,
        shortDescription,
        storeCategory: storeCategoryId || null,
        productType,
        images,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: parseFloat(costPrice),
        unit,
        trackInventory,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        lowStockThreshold,
        isFeatured,
        tags: tags.map((t) => t.toLowerCase().trim()).filter(Boolean),
        weight: parseFloat(weight),
        weightUnit,
        sku,
      });

      if (storeCategoryId) {
        const count = await Product.countDocuments({
          storeCategory: storeCategoryId,
          isActive: true,
        });
        await StoreCategory.findByIdAndUpdate(storeCategoryId, {
          productCount: count,
        });
      }

      const populated = await Product.findById(product._id)
        .populate("storeCategory", "name slug");

      res.status(201).json(populated);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: "A product with this name already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAdminAuth(handler);
