import dbConnect from "@/lib/mongodb";
import {
  handlePaystackWebhook,
  verifyWebhookSignature,
} from "@/services/paymentService";

/**
 * Paystack webhook endpoint.
 * POST /api/store/payment/webhook
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["x-paystack-signature"];

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    await dbConnect();

    const event = JSON.parse(rawBody);
    const result = await handlePaystackWebhook(event);

    res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(200).json({ received: true, error: "Processing error" });
  }
}
