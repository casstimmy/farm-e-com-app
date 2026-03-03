import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";

/**
 * Bulk Update Animals - Set Sales Prices
 * POST /api/admin/health/fix-animals-pricing
 *
 * Fixes animals without sales prices by:
 * 1. Using existing projectedSalesPrice if already set
 * 2. Calculating from purchaseCost + margin if available
 * 3. Using default pricing by species if neither available
 *
 * Query params:
 * - action=estimate: Show what would be updated (dry run)
 * - action=apply: Actually update the database
 * - includeMargin=true: Apply margin to purchaseCost (default: true)
 */

const DEFAULT_PRICES = {
  Cattle: 300000,
  Goat: 100000,
  Sheep: 60000,
  Pig: 150000,
  Chicken: 15000,
  Duck: 20000,
  Turkey: 45000,
  Horse: 500000,
  Donkey: 80000,
};

async function handler(req, res) {
  // Only allow in development or with auth
  const isDev = process.env.NODE_ENV === "development";
  const token = req.headers["x-api-key"] || req.query.token;
  const isAuthorized = isDev || token === process.env.DEBUG_API_TOKEN;

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed - use POST" });
  }

  await dbConnect();

  try {
    const { action = "estimate", includeMargin = "true" } = req.query;
    const shouldApply = action === "apply";
    const useMargin = includeMargin !== "false";

    // Find all animals with zero or no sales price
    const animalsToUpdate = await Animal.find({
      $or: [
        { projectedSalesPrice: 0 },
        { projectedSalesPrice: { $exists: false } },
      ],
      status: "Alive",
    }).lean();

    const updates = [];

    for (const animal of animalsToUpdate) {
      let newPrice = 0;

      // Option 1: Calculate from purchaseCost + margin
      if (useMargin && animal.purchaseCost && animal.purchaseCost > 0) {
        const margin = animal.marginPercent || 30;
        newPrice = Math.round(animal.purchaseCost * (1 + margin / 100));
      }

      // Option 2: Use default price by species
      if (!newPrice && animal.species) {
        newPrice = DEFAULT_PRICES[animal.species] || DEFAULT_PRICES.Goat;
      }

      // Fallback
      if (!newPrice) {
        newPrice = 100000;
      }

      updates.push({
        id: animal._id,
        tagId: animal.tagId,
        name: animal.name,
        species: animal.species,
        currentPrice: animal.projectedSalesPrice || 0,
        newPrice,
        reason: animal.purchaseCost && useMargin ? "calculated from cost + margin" : "default species price",
      });
    }

    // Show results
    const result = {
      action,
      dryRun: !shouldApply,
      animalsToUpdate: updates.length,
      updates,
      summary: {
        totalAnimalsAffected: updates.length,
        totalRevenue: updates.reduce((sum, u) => sum + u.newPrice, 0),
        averagePrice: updates.length > 0
          ? Math.round(updates.reduce((sum, u) => sum + u.newPrice, 0) / updates.length)
          : 0,
      },
    };

    // Actually apply updates if requested
    if (shouldApply && updates.length > 0) {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { projectedSalesPrice: update.newPrice } },
        },
      }));

      const bulkResult = await Animal.bulkWrite(bulkOps);
      result.applied = true;
      result.bulkWriteResult = {
        modifiedCount: bulkResult.modifiedCount,
        acknowledged: bulkResult.acknowledged,
      };
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("[Fix Animals Pricing]", error);
    res.status(500).json({
      error: error.message,
      action: "Please try again with ?action=estimate first",
    });
  }
}

export default handler;
