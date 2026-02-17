import dbConnect from "@/lib/mongodb";
import { verifyPayment } from "@/services/paymentService";

/**
 * Payment verification endpoint.
 * GET /api/store/payment/verify?reference=xxx
 */
export default async function handler(req, res) {
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

    if (result.alreadyVerified) {
      return res.status(200).json({
        status: "success",
        message: "Payment already verified",
        orderId: result.transaction.order,
      });
    }

    if (result.success) {
      return res.status(200).json({
        status: "success",
        message: "Payment verified successfully",
        orderId: result.transaction.order,
      });
    }

    return res.status(400).json({
      status: "failed",
      message: result.reason || "Payment verification failed",
      orderId: result.transaction?.order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
}
