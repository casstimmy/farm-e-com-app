import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Location from "@/models/Location";

/**
 * Public Animals API
 * GET /api/store/animals
 *
 * Lists animals available for sale (status: Alive, not archived).
 * Supports filtering by species, breed, gender, location, weight range.
 * Supports sorting by price, weight, age, name.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const {
      species,
      breed,
      gender,
      location,
      minWeight,
      maxWeight,
      minPrice,
      maxPrice,
      sort = "newest",
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Only show alive, non-archived animals with a sales price
    const filter = {
      status: "Alive",
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 },
    };

    if (species) {
      filter.species = { $regex: new RegExp(`^${species}$`, "i") };
    }

    if (breed) {
      filter.breed = { $regex: new RegExp(breed, "i") };
    }

    if (gender) {
      filter.gender = gender;
    }

    if (location) {
      filter.location = location;
    }

    if (minWeight || maxWeight) {
      filter.currentWeight = {};
      if (minWeight) filter.currentWeight.$gte = parseFloat(minWeight);
      if (maxWeight) filter.currentWeight.$lte = parseFloat(maxWeight);
    }

    if (minPrice || maxPrice) {
      filter.projectedSalesPrice = { ...filter.projectedSalesPrice };
      if (minPrice) filter.projectedSalesPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.projectedSalesPrice.$lte = parseFloat(maxPrice);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { tagId: searchRegex },
        { breed: searchRegex },
        { species: searchRegex },
        { color: searchRegex },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { projectedSalesPrice: 1 },
      price_desc: { projectedSalesPrice: -1 },
      weight_asc: { currentWeight: 1 },
      weight_desc: { currentWeight: -1 },
      age_asc: { dob: -1 },   // youngest first (most recent dob)
      age_desc: { dob: 1 },   // oldest first (earliest dob)
      name_asc: { name: 1 },
    };

    const sortOption = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [animals, totalCount] = await Promise.all([
      Animal.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(perPage)
        .populate("location", "name city state")
        .select("-purchaseCost -totalFeedCost -totalMedicationCost -marginPercent -sire -dam -recordedBy -isArchived -archivedAt -archivedReason")
        .lean(),
      Animal.countDocuments(filter),
    ]);

    // Get species counts for category sidebar
    const speciesCounts = await Animal.aggregate([
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
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get breed counts for the selected species
    let breedCounts = [];
    if (species) {
      breedCounts = await Animal.aggregate([
        {
          $match: {
            species: { $regex: new RegExp(`^${species}$`, "i") },
            status: "Alive",
            isArchived: { $ne: true },
            projectedSalesPrice: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$breed",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);
    }

    // Cache public listing for 30s, revalidate up to 2 min
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );

    res.status(200).json({
      animals,
      speciesCategories: speciesCounts.map((s) => ({
        name: s._id,
        count: s.count,
      })),
      breedCategories: breedCounts.map((b) => ({
        name: b._id,
        count: b.count,
      })),
      pagination: {
        page: pageNum,
        limit: perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
        hasMore: pageNum * perPage < totalCount,
      },
    });
  } catch (error) {
    console.error("Animals API error:", error);
    res.status(500).json({ error: "Failed to fetch animals" });
  }
}
