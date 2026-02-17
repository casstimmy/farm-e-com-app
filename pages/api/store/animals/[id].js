import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Location from "@/models/Location";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Single Animal Detail API
 * GET /api/store/animals/[id]
 *
 * Returns detailed information about a single animal.
 * Also returns related animals (same species/breed).
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid animal ID" });
  }

  await dbConnect();

  try {
    const animal = await Animal.findOne({
      _id: id,
      status: "Alive",
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 },
    })
      .populate("location", "name city state address")
      .select("-purchaseCost -totalFeedCost -totalMedicationCost -marginPercent -sire -dam -recordedBy -isArchived -archivedAt -archivedReason")
      .lean();

    if (!animal) {
      return res.status(404).json({ error: "Animal not found" });
    }

    // Calculate age
    if (animal.dob) {
      const now = new Date();
      const birth = new Date(animal.dob);
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      animal.ageMonths = months;
      animal.ageDisplay =
        months >= 12
          ? `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? "s" : ""} ${months % 12 > 0 ? `${months % 12} month${months % 12 > 1 ? "s" : ""}` : ""}`
          : `${months} month${months !== 1 ? "s" : ""}`;
    }

    // Fetch related animals (same species, different animal)
    const relatedAnimals = await Animal.find({
      _id: { $ne: animal._id },
      species: animal.species,
      status: "Alive",
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 },
    })
      .limit(4)
      .populate("location", "name")
      .select("tagId name species breed gender currentWeight projectedSalesPrice images")
      .lean();

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    res.status(200).json({ animal, relatedAnimals });
  } catch (error) {
    console.error("Animal detail error:", error);
    res.status(500).json({ error: "Failed to fetch animal details" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-animals-detail",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 240,
  },
  handler
);
