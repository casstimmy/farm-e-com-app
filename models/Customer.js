import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true
    },
    locationName: { type: String, default: "Online", index: true },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    // Email verification
    verificationToken: { type: String, default: null },
    verificationExpiry: { type: Date, default: null },
    // Password reset
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    lastLogin: Date,
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ isActive: 1, createdAt: -1 });
CustomerSchema.index({ firstName: 1, lastName: 1 });

// Hash password before saving
CustomerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare submitted password with stored hash
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token (6-digit code)
CustomerSchema.methods.generateVerificationToken = function () {
  const code = crypto.randomInt(100000, 999999).toString();
  this.verificationToken = crypto.createHash("sha256").update(code).digest("hex");
  this.verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return code;
};

// Generate password reset token (6-digit code)
CustomerSchema.methods.generateResetToken = function () {
  const code = crypto.randomInt(100000, 999999).toString();
  this.resetToken = crypto.createHash("sha256").update(code).digest("hex");
  this.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return code;
};

// Verify a token against a hashed value
CustomerSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

CustomerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

CustomerSchema.set("toJSON", { virtuals: true });
CustomerSchema.set("toObject", { virtuals: true });

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
