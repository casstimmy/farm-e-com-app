import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { sendResetPasswordEmail } from "@/services/emailService";
import { withRateLimit } from "@/lib/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const email = req.body?.email?.toString().toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const customer = await Customer.findOne({ email, isActive: true });

    // Always return success to prevent email enumeration
    if (!customer) {
      return res.status(200).json({
        message: "If an account exists with this email, you will receive a reset code.",
      });
    }

    const code = customer.generateResetToken();
    await customer.save();

    // Send reset email (fire-and-forget)
    sendResetPasswordEmail(customer, code).catch((err) =>
      console.error("Failed to send reset email:", err)
    );

    return res.status(200).json({
      message: "If an account exists with this email, you will receive a reset code.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Request failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-auth-forgot",
    methods: ["POST"],
    windowMs: 10 * 60 * 1000,
    max: 5,
  },
  handler
);
