import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import bcrypt from "bcryptjs";
import { withCustomerAuth } from "@/utils/customerAuth";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Customer account management endpoint.
 * GET  /api/store/account — Get profile
 * PUT  /api/store/account — Update profile / addresses / password
 */
async function handler(req, res) {
  await dbConnect();

  const customerId = req.customer.id;

  if (req.method === "GET") {
    try {
      const customer = await Customer.findById(customerId)
        .select("-password")
        .lean();

      if (!customer) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.status(200).json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account" });
    }
  } else if (req.method === "PUT") {
    try {
      const { firstName, lastName, phone, addresses, currentPassword, newPassword } = req.body;

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (firstName) customer.firstName = firstName.trim();
      if (lastName) customer.lastName = lastName.trim();
      if (phone !== undefined) customer.phone = phone.trim();

      if (addresses && Array.isArray(addresses)) {
        const hasDefault = addresses.some((a) => a.isDefault);
        if (addresses.length > 0 && !hasDefault) {
          addresses[0].isDefault = true;
        }
        customer.addresses = addresses;
      }

      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({ error: "Current password is required to set a new password" });
        }

        const isMatch = await bcrypt.compare(currentPassword, customer.password);
        if (!isMatch) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }

        if (newPassword.length < 8) {
          return res
            .status(400)
            .json({ error: "New password must be at least 8 characters" });
        }

        const salt = await bcrypt.genSalt(12);
        customer.password = await bcrypt.hash(newPassword, salt);
      }

      await customer.save();

      const updated = customer.toObject();
      delete updated.password;

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update account" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-account",
    windowMs: 60 * 1000,
    max: 90,
  },
  withCustomerAuth(handler)
);
