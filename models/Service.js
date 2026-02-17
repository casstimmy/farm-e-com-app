import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Veterinary Services",
        "Breeding Services",
        "Feed & Nutrition",
        "Training & Consultation",
        "Processing & Value Addition",
        "Equipment & Facilities",
        "Animal Sales",
        "Waste Management",
        "Other",
      ],
    },
    description: String,
    price: { type: Number, default: 0 },
    unit: String,
    showOnSite: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
