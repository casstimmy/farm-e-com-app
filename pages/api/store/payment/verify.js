import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { verifyPayment } from "@/services/paymentService";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Payment verification endpoint.
 * GET /api/store/payment/verify?reference=xxx
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: "Payment reference is required" });
  }

  try {
    const result = await verifyPayment(reference);

    // Fetch the full order for the response
    const orderId = result.transaction?.order;
    const order = orderId
      ? await Order.findById(orderId).select("orderNumber total status paymentStatus createdAt").lean()
      : null;

    if (result.alreadyVerified) {
      return res.status(200).json({
        status: "success",
        message: "Payment already verified",
        order,
      });
    }

    if (result.success) {
      return res.status(200).json({
        status: "success",
        message: "Payment verified successfully",
        order,
      });
    }

    return res.status(400).json({
      status: "failed",
      message: result.reason || "Payment verification failed",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-payment-verify",
    methods: ["GET"],
    windowMs: 60 * 1000,
    max: 100,
  },
  handler
);
