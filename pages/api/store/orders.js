import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { withCustomerAuth } from "@/utils/customerAuth";

/**
 * Customer order endpoints.
 * GET /api/store/orders           — List customer's orders
 * GET /api/store/orders?id=xxx    — Get single order detail
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const customerId = req.customer.id;
    const { id, page = 1, limit = 10 } = req.query;

    if (id) {
      const order = await Order.findOne({ _id: id, customer: customerId })
        .populate("items.product", "name slug images")
        .lean();

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.status(200).json(order);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * perPage;

    const [orders, totalCount] = await Promise.all([
      Order.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .select(
          "orderNumber status paymentStatus total items.name items.quantity items.lineTotal createdAt"
        )
        .lean(),
      Order.countDocuments({ customer: customerId }),
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
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

export default withCustomerAuth(handler);
