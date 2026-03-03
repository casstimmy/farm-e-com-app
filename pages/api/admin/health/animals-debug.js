import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Location from "@/models/Location";

/**
 * Animals Diagnostic Endpoint
 * GET /api/admin/health/animals-debug?action=check|sample|fix-samples
 *
 * check: Shows database state and why animals might not be displaying
 * sample: Returns sample animals at different states
 * fix-samples: Creates sample animals with proper display criteria
 */
async function handler(req, res) {
  // Only allow in development or with auth token
  const isDev = process.env.NODE_ENV === "development";
  const token = req.headers["x-api-key"] || req.query.token;
  const isAuthorized = isDev || token === process.env.DEBUG_API_TOKEN;

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized. Use in development mode or provide x-api-key header." });
  }

  await dbConnect();

  const { action = "check" } = req.query;

  try {
    if (action === "check") {
      // Get detailed database state
      const [totalAnimals, animalsByStatus, animalsWithPrice, displayableAnimals] = await Promise.all([
        Animal.countDocuments({}),
        Animal.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Animal.countDocuments({ projectedSalesPrice: { $gt: 0 } }),
        Animal.countDocuments({
          status: "Alive",
          isArchived: { $ne: true },
          projectedSalesPrice: { $gt: 0 },
        }),
      ]);

      // Get sample of problem animals
      const notAlive = await Animal.find({ status: { $ne: "Alive" } }).select("tagId species status").limit(3).lean();
      const noPricing = await Animal.find({ projectedSalesPrice: { $lte: 0 } }).select("tagId species projectedSalesPrice").limit(3).lean();
      const archived = await Animal.find({ isArchived: true }).select("tagId species").limit(3).lean();

      return res.status(200).json({
        analysis: {
          totalAnimals,
          displayableAnimals,
          byStatus: Object.fromEntries(animalsByStatus.map((s) => [s._id, s.count])),
          withPricing: animalsWithPrice,
          issues: {
            notAlive: notAlive.length > 0 ? notAlive : null,
            noPricing: noPricing.length > 0 ? noPricing : null,
            archived: archived.length > 0 ? archived : null,
          },
          recommendations: [],
        },
      });
    }

    if (action === "sample") {
      const samples = await Animal.find()
        .select("tagId name species status projectedSalesPrice isArchived")
        .limit(10)
        .lean();
      return res.status(200).json({ samples, total: samples.length });
    }

    if (action === "fix-samples" && isDev) {
      // Create 3 sample animals with proper display criteria
      const location = await Location.findOne({}, "name").lean();
      const locationId = location?._id;

      const samples = [
        {
          tagId: "DEMO-001",
          name: "Demo Animal 1",
          species: "Cattle",
          breed: "Angus",
          status: "Alive",
          isArchived: false,
          projectedSalesPrice: 250000,
          currentWeight: 500,
          location: locationId,
        },
        {
          tagId: "DEMO-002",
          name: "Demo Animal 2",
          species: "Goat",
          breed: "Boer",
          status: "Alive",
          isArchived: false,
          projectedSalesPrice: 75000,
          currentWeight: 80,
          location: locationId,
        },
        {
          tagId: "DEMO-003",
          name: "Demo Animal 3",
          species: "Sheep",
          breed: "Dorper",
          status: "Alive",
          isArchived: false,
          projectedSalesPrice: 45000,
          currentWeight: 60,
          location: locationId,
        },
      ];

      // Check if already exist
      const existing = await Animal.countDocuments({ tagId: { $in: samples.map((s) => s.tagId) } });
      if (existing > 0) {
        return res.status(400).json({ error: "Sample animals already exist. Delete them first." });
      }

      const created = await Animal.insertMany(samples);
      return res.status(201).json({
        message: "Sample animals created successfully",
        count: created.length,
        animals: created,
      });
    }

    res.status(400).json({ error: "Invalid action. Use: check, sample, or fix-samples" });
  } catch (error) {
    console.error("[Animals Debug]", error);
    res.status(500).json({ error: error.message });
  }
}

export default handler;
