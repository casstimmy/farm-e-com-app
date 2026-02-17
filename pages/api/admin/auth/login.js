import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateAdminToken } from "@/utils/adminAuth";
import { withRateLimit } from "@/lib/rateLimit";

/**
 * Admin authentication endpoint.
 * POST /api/admin/auth/login
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = req.body?.email?.toString().trim().toLowerCase();
  const pin = (req.body?.pin ?? req.body?.password ?? "").toString().trim();

  if (!email || !pin) {
    return res.status(400).json({ error: "Email and PIN are required" });
  }

  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: "PIN must be exactly 4 digits" });
  }

  try {
    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    if (user.pin !== pin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!["SuperAdmin", "Manager"].includes(user.role)) {
      return res.status(403).json({
        error: "Access denied. Only Managers and SuperAdmins can access the store admin.",
      });
    }

    const adminToken = generateAdminToken({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      token: adminToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "admin-auth-login",
    methods: ["POST"],
    windowMs: 5 * 60 * 1000,
    max: 20,
  },
  handler
);
