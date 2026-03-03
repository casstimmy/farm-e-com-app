import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { withAdminAuth } from "@/utils/adminAuth";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Admin customer management endpoint.
 * GET /api/admin/store/customers — List all customers with stats
 */
async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      search,
      active,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    if (search) {
      // Escape regex special characters to prevent ReDoS
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { firstName: 1, lastName: 1 },
      spent: { totalSpent: -1 },
      orders: { orderCount: -1 },
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [customers, totalCount] = await Promise.all([
      Customer.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(perPage)
        .select("-password")
        .lean(),
      Customer.countDocuments(filter),
    ]);

    res.status(200).json({
      customers,
      pagination: {
        page: pageNum,
        limit: perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (error) {
    console.error("Admin customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "admin-store-customers",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 120,
  },
  withAdminAuth(handler)
);
