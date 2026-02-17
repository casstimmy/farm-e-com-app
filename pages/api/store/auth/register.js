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
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingCustomer) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const customer = await Customer.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim() || "",
      isVerified: true,
    });

    const token = generateCustomerToken(customer);

    res.status(201).json({
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
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
}
