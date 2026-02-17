import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { withAdminAuth } from "@/utils/adminAuth";

/**
 * Admin transaction listing endpoint.
 * GET /api/admin/store/transactions — List all payment transactions
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .populate("order", "orderNumber total status")
        .populate("customer", "firstName lastName email")
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page: pageNum,
        limit: perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default withAdminAuth(handler);
