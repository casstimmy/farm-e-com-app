import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
import { withAdminAuth } from "@/utils/adminAuth";
import { updateOrderStatus, confirmOrderPayment } from "@/services/orderService";

/**
 * Admin single order management endpoint.
 * GET /api/admin/store/orders/[id] — Get order detail with transactions
 * PUT /api/admin/store/orders/[id] — Update order status
 */
async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const order = await Order.findById(id)
        .populate("customer", "firstName lastName email phone addresses")
        .populate("items.product", "name slug images")
        .lean();

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const transactions = await Transaction.find({ order: id })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({ order, transactions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { status, note, adminNotes } = req.body;

      if (status) {
        const order = await updateOrderStatus(id, status, {
          note,
          changedBy: req.user?.email || "Admin",
        });

        if (status === "Paid") {
          await confirmOrderPayment(id);
        }

        if (adminNotes) {
          order.adminNotes = adminNotes;
          await order.save();
        }

        const updated = await Order.findById(id)
          .populate("customer", "firstName lastName email phone")
          .lean();

        return res.status(200).json(updated);
      }

      if (adminNotes !== undefined) {
        await Order.findByIdAndUpdate(id, { adminNotes });
        return res.status(200).json({ message: "Notes updated" });
      }

      res.status(400).json({ error: "No updates provided" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAdminAuth(handler);
