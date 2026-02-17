import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";

/**
 * Single Service Detail API
 * GET /api/store/services/[id]
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid service ID" });
  }

  await dbConnect();

  try {
    const service = await Service.findOne({
      _id: id,
      showOnSite: true,
      isActive: true,
    }).lean();

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Related services (same category)
    const relatedServices = await Service.find({
      _id: { $ne: service._id },
      category: service.category,
      showOnSite: true,
      isActive: true,
    })
      .limit(4)
      .lean();

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    res.status(200).json({ service, relatedServices });
  } catch (error) {
    console.error("Service detail error:", error);
    res.status(500).json({ error: "Failed to fetch service details" });
  }
}
