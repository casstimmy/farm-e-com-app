import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import bcrypt from "bcryptjs";
import { generateCustomerToken } from "@/utils/customerAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const customer = await Customer.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!customer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!customer.isActive) {
      return res
        .status(403)
        .json({ error: "Your account has been deactivated" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    customer.lastLogin = new Date();
    await customer.save();

    const token = generateCustomerToken(customer);

    res.status(200).json({
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
    res.status(500).json({ error: "Login failed. Please try again." });
  }
}
