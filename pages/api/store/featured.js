import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Inventory from "@/models/Inventory";
import Service from "@/models/Service";

/**
 * Homepage featured content API
 * GET /api/store/featured
 *
 * Returns featured animals, inventory items, and services
 * for the homepage showcase.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const [animals, inventoryItems, services, animalStats] = await Promise.all([
      // Featured animals — newest available
      Animal.find({
        status: "Alive",
        isArchived: { $ne: true },
        projectedSalesPrice: { $gt: 0 },
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("location", "name")
        .select("tagId name species breed gender currentWeight projectedSalesPrice images location dob")
        .lean(),

      // Featured inventory items
      Inventory.find({
        showOnSite: true,
        quantity: { $gt: 0 },
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("item salesPrice price quantity unit categoryName")
        .lean(),

      // Featured services
      Service.find({
        showOnSite: true,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // Animal species counts for category cards
      Animal.aggregate([
        {
          $match: {
            status: "Alive",
            isArchived: { $ne: true },
            projectedSalesPrice: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$species",
            count: { $sum: 1 },
            avgPrice: { $avg: "$projectedSalesPrice" },
            sample: { $first: "$images" },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Cache homepage data for 30s, revalidate up to 2 min
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );

    res.status(200).json({
      animals,
      inventoryItems,
      services,
      animalCategories: animalStats.map((s) => ({
        species: s._id,
        count: s.count,
        avgPrice: Math.round(s.avgPrice),
        image: s.sample?.[0]?.thumb || s.sample?.[0]?.full || null,
      })),
      totals: {
        animals: await Animal.countDocuments({
          status: "Alive",
          isArchived: { $ne: true },
          projectedSalesPrice: { $gt: 0 },
        }),
        products: await Inventory.countDocuments({
          showOnSite: true,
          quantity: { $gt: 0 },
        }),
        services: await Service.countDocuments({
          showOnSite: true,
          isActive: true,
        }),
      },
    });
  } catch (error) {
    console.error("Featured API error:", error);
    res.status(500).json({ error: "Failed to fetch featured content" });
  }
}
