import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Inventory from "@/models/Inventory";
import Service from "@/models/Service";

const FEATURE_LIMIT = 6;
const QUERY_TIMEOUT_MS = 4000;

function toCategoryRows(stats) {
  return stats.map((s) => ({
    species: s._id,
    count: s.count,
    avgPrice: Math.round(s.avgPrice || 0),
    image: s.sample?.[0]?.thumb || s.sample?.[0]?.full || null,
  }));
}

function safeValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

export async function fetchHomepageData() {
  await dbConnect();

  const [
    animalsResult,
    inventoryResult,
    servicesResult,
    animalStatsResult,
    animalCountResult,
    productCountResult,
    serviceCountResult,
  ] = await Promise.allSettled([
    Animal.find({
      status: "Alive",
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 },
    })
      .sort({ createdAt: -1 })
      .limit(FEATURE_LIMIT)
      .populate("location", "name")
      .select(
        "tagId name species breed gender currentWeight projectedSalesPrice images location dob"
      )
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean(),
    Inventory.find({
      showOnSite: true,
      quantity: { $gt: 0 },
    })
      .sort({ createdAt: -1 })
      .limit(FEATURE_LIMIT)
      .select("item salesPrice price quantity unit categoryName")
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean(),
    Service.find({
      showOnSite: true,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(FEATURE_LIMIT)
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean(),
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
    ]).option({ maxTimeMS: QUERY_TIMEOUT_MS }),
    Animal.countDocuments({
      status: "Alive",
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 },
    }).maxTimeMS(QUERY_TIMEOUT_MS),
    Inventory.countDocuments({
      showOnSite: true,
      quantity: { $gt: 0 },
    }).maxTimeMS(QUERY_TIMEOUT_MS),
    Service.countDocuments({
      showOnSite: true,
      isActive: true,
    }).maxTimeMS(QUERY_TIMEOUT_MS),
  ]);

  return {
    animals: safeValue(animalsResult, []),
    inventoryItems: safeValue(inventoryResult, []),
    services: safeValue(servicesResult, []),
    animalCategories: toCategoryRows(safeValue(animalStatsResult, [])),
    totals: {
      animals: safeValue(animalCountResult, 0),
      products: safeValue(productCountResult, 0),
      services: safeValue(serviceCountResult, 0),
    },
  };
}
