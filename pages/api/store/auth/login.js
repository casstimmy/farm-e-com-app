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
    const password = req.body?.password?.toString() || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Select password explicitly in case schema ever excludes it
    const customer = await Customer.findOne({ email }).select("+password");
    if (!customer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!customer.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated. Contact support for help." });
    }

    if (!customer.isVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox for the verification link." });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Use updateOne to avoid triggering pre-save hook (prevents re-hashing password)
    await Customer.updateOne({ _id: customer._id }, { $set: { lastLogin: new Date() } });

    const token = generateCustomerToken(customer);
    return res.status(200).json({
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
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-auth-login",
    methods: ["POST"],
    windowMs: 5 * 60 * 1000,
    max: 30,
  },
  handler
);
