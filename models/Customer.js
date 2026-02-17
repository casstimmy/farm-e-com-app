import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: "Nigeria" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: { type: String, required: true, minlength: 8 },
    phone: {
      type: String,
      trim: true,
      match: [/^[\d+\-\s()]{7,20}$/, "Please provide a valid phone number"],
    },
    addresses: [AddressSchema],
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLogin: Date,
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ createdAt: -1 });

CustomerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

CustomerSchema.set("toJSON", { virtuals: true });
CustomerSchema.set("toObject", { virtuals: true });

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
