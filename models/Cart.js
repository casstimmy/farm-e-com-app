import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },
    items: [CartItemSchema],
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

CartSchema.virtual("subtotal").get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
});

CartSchema.set("toJSON", { virtuals: true });
CartSchema.set("toObject", { virtuals: true });

// TTL index: automatically remove carts inactive for 30 days
CartSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.models.Cart || mongoose.model("Cart", CartSchema);
