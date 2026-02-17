import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

/**
 * Public product detail endpoint.
 * GET /api/store/products/[slug]
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  const { slug } = req.query;

  try {
    const product = await Product.findOneAndUpdate(
      { slug, isActive: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate("storeCategory", "name slug")
      .select("-costPrice")
      .lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let relatedProducts = [];
    if (product.storeCategory) {
      relatedProducts = await Product.find({
        storeCategory: product.storeCategory._id,
        _id: { $ne: product._id },
        isActive: true,
      })
        .limit(4)
        .select("name slug price compareAtPrice images stockQuantity unit")
        .lean();
    }

    res.status(200).json({ product, relatedProducts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
}
