import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "", maxlength: 300 },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    storeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreCategory",
      default: null,
    },
    productType: {
      type: String,
      enum: ["physical", "service"],
      default: "physical",
    },
    serviceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    animalRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      default: null,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "Unit" },
    trackInventory: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    weight: { type: Number, default: 0 },
    weightUnit: { type: String, default: "kg" },
    sku: { type: String, default: "", trim: true },
    viewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ storeCategory: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ inventoryItem: 1 });
ProductSchema.index({ serviceRef: 1 });
ProductSchema.index({ animalRef: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ salesCount: -1 });
ProductSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, tags: 5, description: 1 } }
);

ProductSchema.pre("validate", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

ProductSchema.virtual("isInStock").get(function () {
  if (!this.trackInventory) return true;
  return this.stockQuantity > 0;
});

ProductSchema.virtual("isLowStock").get(function () {
  if (!this.trackInventory) return false;
  return this.stockQuantity > 0 && this.stockQuantity <= this.lowStockThreshold;
});

ProductSchema.virtual("discountPercent").get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(
    ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
  );
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
