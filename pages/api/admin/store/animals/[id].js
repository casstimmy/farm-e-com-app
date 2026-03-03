import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { ObjectId } from "mongodb";

/**
 * Animal Detail API
 * GET /api/admin/store/animals/[id] - Get animal details
 * PUT /api/admin/store/animals/[id] - Update animal
 * DELETE /api/admin/store/animals/[id] - Delete animal
 */

async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const isAuthorized = token && process.env.ADMIN_API_TOKEN && token === process.env.ADMIN_API_TOKEN;

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid animal ID" });
  }

  await dbConnect();

  try {
    if (req.method === "GET") {
      const animal = await Animal.findById(id).lean();

      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      return res.status(200).json(animal);
    }

    if (req.method === "PUT") {
      const {
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

      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (species !== undefined) updateData.species = species;
      if (breed !== undefined) updateData.breed = breed;
      if (gender !== undefined) updateData.gender = gender;
      if (dob !== undefined) updateData.dob = dob ? new Date(dob) : undefined;
      if (color !== undefined) updateData.color = color;
      if (currentWeight !== undefined) updateData.currentWeight = parseFloat(currentWeight) || 0;
      if (purchaseCost !== undefined) updateData.purchaseCost = parseFloat(purchaseCost) || 0;
      if (marginPercent !== undefined) updateData.marginPercent = parseFloat(marginPercent) || 30;
      if (projectedSalesPrice !== undefined) {
        updateData.projectedSalesPrice = parseFloat(projectedSalesPrice) || 0;
      }
      if (salesPrice !== undefined) {
        updateData.salesPrice = parseFloat(salesPrice) || 0;
      }
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const animal = await Animal.findByIdAndUpdate(id, updateData, { new: true }).lean();

      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      return res.status(200).json({
        message: "Animal updated successfully",
        animal,
      });
    }

    if (req.method === "DELETE") {
      const animal = await Animal.findByIdAndDelete(id);

      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      return res.status(200).json({
        message: "Animal deleted successfully",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Animal detail API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export default handler;
