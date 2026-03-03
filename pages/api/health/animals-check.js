import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";

/**
 * Animals Database Health Check
 * GET /api/health/animals-check
 *
 * Diagnoses animals data availability and filtering issues
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Get comprehensive animal statistics
    const [
      totalCount,
      aliveCount,
      deadCount,
      soldCount,
      quarantinedCount,
      archivedCount,
      hasSalesPriceCount,
      displayableCount,
      sampleAnimals,
    ] = await Promise.all([
      Animal.countDocuments({}),
      Animal.countDocuments({ status: "Alive" }),
      Animal.countDocuments({ status: "Dead" }),
      Animal.countDocuments({ status: "Sold" }),
      Animal.countDocuments({ status: "Quarantined" }),
      Animal.countDocuments({ isArchived: true }),
      Animal.countDocuments({ projectedSalesPrice: { $gt: 0 } }),
      Animal.countDocuments({
        status: "Alive",
        isArchived: { $ne: true },
        projectedSalesPrice: { $gt: 0 },
      }),
      Animal.find({
        status: "Alive",
        isArchived: { $ne: true },
        projectedSalesPrice: { $gt: 0 },
      })
        .select("tagId name species breed status projectedSalesPrice isArchived createdAt")
        .limit(5)
        .lean(),
    ]);

    // Check for animals without sales price
    const noSalePriceAnimals = await Animal.find({
      status: "Alive",
      isArchived: { $ne: true },
      $or: [{ projectedSalesPrice: 0 }, { projectedSalesPrice: { $exists: false } }],
    })
      .select("tagId name species status projectedSalesPrice")
      .limit(5)
      .lean();

    const health = {
      status: displayableCount > 0 ? "healthy" : "no-inventory",
      timestamp: new Date().toISOString(),
      database: {
        totalAnimals: totalCount,
        byStatus: {
          Alive: aliveCount,
          Dead: deadCount,
          Sold: soldCount,
          Quarantined: quarantinedCount,
          Archived: archivedCount,
        },
        withSalesPrice: hasSalesPriceCount,
        displayable: displayableCount,
      },
      displayCriteria: {
        requireStatus: "Alive",
        requireArchived: false,
        requireSalesPrice: "> 0",
      },
      issues: [],
      samples: {
        displayable: sampleAnimals,
        noSalesPrice: noSalePriceAnimals,
      },
    };

    // Identify issues
    if (totalCount === 0) {
      health.issues.push("Database is empty - no animals created yet");
    } else if (aliveCount === 0) {
      health.issues.push("No animals with status 'Alive' - all animals are dead, sold, or quarantined");
    } else if (hasSalesPriceCount === 0) {
      health.issues.push("No animals have projectedSalesPrice set - pricing not configured");
    } else if (displayableCount === 0) {
      health.issues.push("No animals match all display criteria - check status, archive, and price settings");
    } else if (displayableCount < 5) {
      health.issues.push(`Low inventory: only ${displayableCount} animals available for display`);
    }

    res.status(200).json(health);
  } catch (error) {
    console.error("[Animals Health Check] Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export default handler;
