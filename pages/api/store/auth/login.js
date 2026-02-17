import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import bcrypt from "bcryptjs";
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

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!customer.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    customer.lastLogin = new Date();
    await customer.save();

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
  } catch {
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
