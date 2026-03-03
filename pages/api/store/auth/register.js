import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { withRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/services/emailService";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const firstName = req.body?.firstName?.toString().trim();
    const lastName = req.body?.lastName?.toString().trim();
    const email = req.body?.email?.toString().toLowerCase().trim();
    const password = req.body?.password?.toString() || "";
    const phone = req.body?.phone?.toString().trim() || "";

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      // If exists but not verified, allow re-sending verification
      if (!existingCustomer.isVerified) {
        const code = existingCustomer.generateVerificationToken();
        await existingCustomer.save();

        // Send verification email (don't block response)
        sendVerificationEmail(existingCustomer, code).catch((err) =>
          console.error("Failed to send verification email:", err)
        );

        return res.status(200).json({
          message: "A verification code has been sent to your email. Please check your inbox.",
          requiresVerification: true,
          email,
        });
      }
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const customer = new Customer({
      firstName,
      lastName,
      email,
      password,
      phone,
      isVerified: false,
    });

    // Generate verification code
    const code = customer.generateVerificationToken();
    await customer.save();

    // Send verification email (don't block response)
    sendVerificationEmail(customer, code).catch((err) =>
      console.error("Failed to send verification email:", err)
    );

    return res.status(201).json({
      message: "Account created. Please check your email for the verification code.",
      requiresVerification: true,
      email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-auth-register",
    methods: ["POST"],
    windowMs: 10 * 60 * 1000,
    max: 20,
  },
  handler
);
