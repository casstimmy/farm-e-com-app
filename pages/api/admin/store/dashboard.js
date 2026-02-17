import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import { withAdminAuth } from "@/utils/adminAuth";
import { getOrderStats } from "@/services/orderService";

/**
 * Admin store dashboard stats endpoint.
 * GET /api/admin/store/dashboard
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

    const { period = "month" } = req.query;

    const now = new Date();
    let dateFrom = null;
    if (period === "today") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "quarter") {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (period === "year") {
      dateFrom = new Date(now.getFullYear(), 0, 1);
    }

    const [
      orderStats,
      totalCustomers,
      newCustomers,
      totalProducts,
      activeProducts,
      topProducts,
      recentOrders,
      revenueByDay,
    ] = await Promise.all([
      getOrderStats(dateFrom),
      Customer.countDocuments(),
      Customer.countDocuments(
        dateFrom ? { createdAt: { $gte: dateFrom } } : {}
      ),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.find({ salesCount: { $gt: 0 } })
        .sort({ salesCount: -1 })
        .limit(5)
        .select("name slug price salesCount images")
        .lean(),
      Order.find(dateFrom ? { createdAt: { $gte: dateFrom } } : {})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber customerName total status paymentStatus createdAt")
        .lean(),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            ...(dateFrom ? { createdAt: { $gte: dateFrom } } : {}),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    res.status(200).json({
      orders: orderStats,
      customers: {
        total: totalCustomers,
        new: newCustomers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      topProducts,
      recentOrders,
      revenueByDay,
      period,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default withAdminAuth(handler);
