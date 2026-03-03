import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";

/**
 * Animals Management API
 * GET /api/admin/store/animals - List animals
 * POST /api/admin/store/animals - Create animal
 */

async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const isAuthorized = token && process.env.ADMIN_API_TOKEN && token === process.env.ADMIN_API_TOKEN;

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await dbConnect();

  try {
    if (req.method === "GET") {
      const { search, species, status, skip = 0, limit = 50 } = req.query;
      const filter = {};

      if (search) {
        const searchRegex = new RegExp(search, "i");
        filter.$or = [
          { tagId: searchRegex },
          { name: searchRegex },
          { breed: searchRegex },
        ];
      }

      if (species) {
        filter.species = { $regex: new RegExp(`^${species}$`, "i") };
      }

      if (status) {
        filter.status = status;
      }

      const [animals, total] = await Promise.all([
        Animal.find(filter)
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .lean(),
        Animal.countDocuments(filter),
      ]);

      return res.status(200).json({
        animals,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }

    if (req.method === "POST") {
      const {
        tagId,
        name,
        species,
        breed,
        gender,
        dob,
        color,
        currentWeight,
        purchaseCost,
        marginPercent,
        projectedSalesPrice,
        salesPrice,
        status,
        notes,
      } = req.body;

      if (!tagId || !species) {
        return res.status(400).json({ error: "tagId and species are required" });
      }

      // Check for duplicate tagId
      const existing = await Animal.findOne({ tagId });
      if (existing) {
        return res.status(400).json({ error: "An animal with this tag ID already exists" });
      }

      const animal = await Animal.create({
        tagId,
        name: name || undefined,
        species,
        breed: breed || undefined,
        gender: gender || "Male",
        dob: dob ? new Date(dob) : undefined,
        color: color || undefined,
        currentWeight: currentWeight ? parseFloat(currentWeight) : 0,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : 0,
        marginPercent: marginPercent ? parseFloat(marginPercent) : 30,
        projectedSalesPrice: projectedSalesPrice ? parseFloat(projectedSalesPrice) : 0,
        salesPrice: salesPrice ? parseFloat(salesPrice) : 0,
        status: status || "Alive",
        notes: notes || undefined,
      });

      return res.status(201).json({
        message: "Animal created successfully",
        animal,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Animals API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export default handler;
