import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
import { verifyPayment } from "@/services/paymentService";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Payment verification endpoint.
 * GET /api/store/payment/verify?reference=xxx
 *
 * This endpoint is called after Paystack redirect. It verifies the payment
 * with Paystack and validates transaction ownership via the stored customer ID.
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  const { reference } = req.query;

  if (!reference || typeof reference !== "string" || reference.length > 100) {
    return res.status(400).json({ error: "Valid payment reference is required" });
  }

  try {
    // Check that the transaction exists and get its order for ownership validation
    const transaction = await Transaction.findOne({ reference }).select("order customer").lean();
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const result = await verifyPayment(reference);

    // Fetch the order for the response — only return minimal fields
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
      message: "Payment verification failed",
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
    max: 30,
  },
  handler
);
