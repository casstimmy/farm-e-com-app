import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["Paystack", "Bank Transfer", "Cash"],
      default: "Paystack",
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed", "Reversed"],
      default: "Pending",
      index: true,
    },
    providerReference: String,
    providerResponse: mongoose.Schema.Types.Mixed,
    channel: String,
    paidAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
    failureReason: String,
    ipAddress: String,
  },
  { timestamps: true }
);

TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
