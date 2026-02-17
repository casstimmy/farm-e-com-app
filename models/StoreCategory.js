import mongoose from "mongoose";

const StoreCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreCategory",
      default: null,
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

StoreCategorySchema.index({ slug: 1 }, { unique: true });
StoreCategorySchema.index({ parent: 1 });
StoreCategorySchema.index({ isActive: 1, sortOrder: 1 });

StoreCategorySchema.pre("validate", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

export default mongoose.models.StoreCategory ||
  mongoose.model("StoreCategory", StoreCategorySchema);
