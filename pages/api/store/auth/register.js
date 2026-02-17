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
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      isVerified: true,
    });

    const token = generateCustomerToken(customer);
    return res.status(201).json({
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
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
