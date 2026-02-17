import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    pin: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 4,
      validate: {
        validator: function (v) {
          return /^\d{4}$/.test(v);
        },
        message: "PIN must be exactly 4 digits",
      },
    },
    role: {
      type: String,
      enum: ["SuperAdmin", "Manager", "Attendant"],
      default: "Attendant",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, pin: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
