import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { withAdminAuth } from "@/utils/adminAuth";
import { getOrderStats } from "@/services/orderService";

/**
 * Admin order management endpoint.
 * GET /api/admin/store/orders — List all orders with filters
 */
async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const {
        status,
        paymentStatus,
        search,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        stats: includeStats,
      } = req.query;

      if (includeStats === "true") {
        const stats = await getOrderStats(dateFrom);
        return res.status(200).json(stats);
      }

      const filter = {};
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;

      if (search) {
        filter.$or = [
          { orderNumber: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { customerEmail: { $regex: search, $options: "i" } },
        ];
      }

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * perPage;

      const [orders, totalCount] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPage)
          .populate("customer", "firstName lastName email phone")
          .lean(),
        Order.countDocuments(filter),
      ]);

      res.status(200).json({
        orders,
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
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAdminAuth(handler);
