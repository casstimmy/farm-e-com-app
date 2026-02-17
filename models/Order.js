import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    name: { type: String, required: true },
    slug: String,
    image: String,
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "Unit" },
  },
  { _id: true }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: String,
    changedBy: String,
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
      index: true,
    },
    statusHistory: [StatusHistorySchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "Nigeria" },
    },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    paymentMethod: {
      type: String,
      enum: ["Paystack", "Bank Transfer", "Cash on Delivery"],
      default: "Paystack",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded", "Partially Refunded"],
      default: "Unpaid",
      index: true,
    },
    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    notes: String,
    adminNotes: String,
    inventoryDeducted: { type: Boolean, default: false },
    financeRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ customerEmail: 1 });

// Generate order number before saving
OrderSchema.pre("validate", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const datePart = new Date()
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, "");
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    this.orderNumber = `ORD-${datePart}-${randomPart}`;
  }
  next();
});

// Track status changes
OrderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });

    if (this.status === "Paid" && !this.paidAt) {
      this.paidAt = new Date();
    }
    if (this.status === "Shipped" && !this.shippedAt) {
      this.shippedAt = new Date();
    }
    if (this.status === "Delivered" && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
    if (this.status === "Cancelled" && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);
