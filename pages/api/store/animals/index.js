import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Location from "@/models/Location";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Public Animals API
 * GET /api/store/animals
 *
 * Lists animals available for sale (status: Alive, not archived).
 * Supports filtering by species, breed, gender, location, weight range.
 * Supports sorting by price, weight, age, name.
 */
async function handler(req, res) {
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
    };

    // Core price requirement - must have salesPrice or projectedSalesPrice
    const priceFilter = { $or: [{ salesPrice: { $gt: 0 } }, { projectedSalesPrice: { $gt: 0 } }] };

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

    // Build price range filter
    const priceRangeConditions = [];
    if (minPrice || maxPrice) {
      if (minPrice) {
        const minVal = parseFloat(minPrice);
        priceRangeConditions.push({ salesPrice: { $gte: minVal } });
        priceRangeConditions.push({ projectedSalesPrice: { $gte: minVal } });
      }
      if (maxPrice) {
        const maxVal = parseFloat(maxPrice);
        priceRangeConditions.push({ salesPrice: { $lte: maxVal } });
        priceRangeConditions.push({ projectedSalesPrice: { $lte: maxVal } });
      }
    }

    // Handle search
    const searchConditions = [];
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      searchConditions.push({ name: searchRegex });
      searchConditions.push({ tagId: searchRegex });
      searchConditions.push({ breed: searchRegex });
      searchConditions.push({ species: searchRegex });
      searchConditions.push({ color: searchRegex });
    }

    // Combine all conditions properly
    if (searchConditions.length > 0 && priceRangeConditions.length > 0) {
      // Both search and price range
      filter.$and = [
        priceFilter,
        { $or: searchConditions },
        { $or: priceRangeConditions },
      ];
    } else if (searchConditions.length > 0) {
      // Only search
      filter.$and = [priceFilter, { $or: searchConditions }];
    } else if (priceRangeConditions.length > 0) {
      // Only price range
      filter.$and = [priceFilter, { $or: priceRangeConditions }];
    } else {
      // Neither search nor price range
      Object.assign(filter, priceFilter);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { salesPrice: 1, projectedSalesPrice: 1 },
      price_desc: { salesPrice: -1, projectedSalesPrice: -1 },
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
        .lean()
        .exec(),
      Animal.countDocuments(filter),
    ]);

    // Debug logging
    console.log(`[Animals API] Filter applied: ${JSON.stringify(filter)}`);
    console.log(`[Animals API] Results: ${animals.length} items returned`);
    console.log(`[Animals API] Filtered count (matching all criteria): ${totalCount}`);
    if (animals.length === 0 && totalCount === 0) {
      console.warn(`[Animals API] WARNING: No animals match the filter! Check if database is populated.`);
    }

    // Get species counts for category sidebar
    const speciesCounts = await Animal.aggregate([
      {
        $match: {
          status: "Alive",
          isArchived: { $ne: true },
          $or: [{ salesPrice: { $gt: 0 } }, { projectedSalesPrice: { $gt: 0 } }],
          species: { $exists: true, $ne: null, $ne: "" },
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
            $or: [{ salesPrice: { $gt: 0 } }, { projectedSalesPrice: { $gt: 0 } }],
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
    console.error("[Animals API] ERROR:", error.message);
    console.error("[Animals API] Stack:", error.stack);
    res.status(500).json({ error: "Failed to fetch animals", details: error.message });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-animals-list",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 180,
  },
  handler
);
