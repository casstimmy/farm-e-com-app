import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { generateCustomerToken } from "@/utils/customerAuth";
import { withRateLimit } from "@/lib/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const email = req.body?.email?.toString().toLowerCase().trim();
    const code = req.body?.code?.toString().trim();
    const newPassword = req.body?.newPassword?.toString() || "";

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required" });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Invalid reset code format" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const hashedCode = Customer.hashToken(code);

    const customer = await Customer.findOne({
      email,
      resetToken: hashedCode,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!customer) {
      return res.status(400).json({
        error: "Invalid or expired reset code. Please request a new one.",
      });
    }

    // Update password and clear reset token
    customer.password = newPassword;
    customer.resetToken = null;
    customer.resetTokenExpiry = null;
    customer.lastLogin = new Date();
    await customer.save(); // Pre-save hook will hash the password

    const token = generateCustomerToken(customer);
    return res.status(200).json({
      message: "Password reset successfully. You are now logged in.",
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
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Password reset failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-auth-reset",
    methods: ["POST"],
    windowMs: 10 * 60 * 1000,
    max: 10,
  },
  handler
);
