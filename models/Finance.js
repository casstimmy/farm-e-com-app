import mongoose from "mongoose";

const FinanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Check", "Mobile Money"],
      default: "Cash",
    },
    vendor: String,
    invoiceNumber: String,
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Completed",
    },
    relatedAnimal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      default: null,
    },
    relatedInventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    recordedBy: String,
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    notes: String,
  },
  { timestamps: true }
);

FinanceSchema.index({ type: 1, date: -1 });
FinanceSchema.index({ category: 1 });

export default mongoose.models.Finance ||
  mongoose.model("Finance", FinanceSchema);
