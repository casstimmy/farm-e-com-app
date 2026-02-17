import mongoose from "mongoose";

const InventoryCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.InventoryCategory ||
  mongoose.model("InventoryCategory", InventoryCategorySchema);
