import { fetchHomepageData } from "@/lib/homepageData";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Homepage featured content API
 * GET /api/store/featured
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const featuredData = await fetchHomepageData();

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );

    return res.status(200).json(featuredData);
  } catch (error) {
    console.error("Featured API error:", error);
    return res.status(500).json({ error: "Failed to fetch featured content" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-featured",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 240,
  },
  handler
);
