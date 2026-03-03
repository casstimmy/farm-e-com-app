import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { generateCustomerToken } from "@/utils/customerAuth";
import { sendWelcomeEmail } from "@/services/emailService";
import { withRateLimit } from "@/lib/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const email = req.body?.email?.toString().toLowerCase().trim();
    const code = req.body?.code?.toString().trim();

    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Invalid verification code format" });
    }

    const hashedCode = Customer.hashToken(code);

    const customer = await Customer.findOne({
      email,
      verificationToken: hashedCode,
      verificationExpiry: { $gt: new Date() },
    });

    if (!customer) {
      return res.status(400).json({
        error: "Invalid or expired verification code. Please request a new one.",
      });
    }

    // Mark as verified and clear token
    customer.isVerified = true;
    customer.verificationToken = null;
    customer.verificationExpiry = null;
    customer.lastLogin = new Date();
    await customer.save();

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(customer).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    const token = generateCustomerToken(customer);
    return res.status(200).json({
      message: "Email verified successfully. Welcome!",
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        addresses: customer.addresses,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-auth-verify",
    methods: ["POST"],
    windowMs: 5 * 60 * 1000,
    max: 15,
  },
  handler
);
