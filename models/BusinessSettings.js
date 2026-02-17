import mongoose from "mongoose";

const BusinessSettingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    businessEmail: {
      type: String,
      default: "",
    },
    businessPhone: {
      type: String,
      default: "",
    },
    businessAddress: {
      type: String,
      default: "",
    },
    businessLogo: {
      type: String,
      default: "",
    },
    businessDescription: {
      type: String,
      default: "",
    },
    loginHeroImage: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "NGN",
    },
    timezone: {
      type: String,
      default: "UTC+1",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.BusinessSettings || mongoose.model("BusinessSettings", BusinessSettingsSchema);
