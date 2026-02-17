import dbConnect from "@/lib/mongodb";
import BusinessSettings from "@/models/BusinessSettings";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Public Business Settings API
 * GET /api/store/settings
 *
 * Returns public-facing business information (name, logo, contact).
 * No auth required — used by store layout.
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const settings = await BusinessSettings.findOne()
      .select("businessName businessLogo businessEmail businessPhone businessAddress businessDescription currency")
      .lean();

    // Cache for 5 minutes
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

    res.status(200).json(settings || {
      businessName: process.env.NEXT_PUBLIC_APP_NAME || "Farm Store",
      businessLogo: "",
      businessEmail: "",
      businessPhone: "",
      businessAddress: "",
      businessDescription: "",
      currency: "NGN",
    });
  } catch (error) {
    console.error("Settings API error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-settings",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 300,
  },
  handler
);
