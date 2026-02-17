import axios from "axios";
import { generateAdminToken } from "@/utils/adminAuth";

const FARM_API_URL = process.env.FARM_API_URL || "http://localhost:3000";

/**
 * Admin authentication endpoint.
 * POST /api/admin/auth/login
 *
 * Proxies credentials to farm-health-app for verification,
 * then issues a local admin token.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Verify credentials against farm-health-app
    const { data } = await axios.post(`${FARM_API_URL}/api/auth/login`, {
      email,
      password,
    });

    // Only allow Manager and SuperAdmin roles
    if (!["SuperAdmin", "Manager"].includes(data.user?.role)) {
      return res.status(403).json({
        error: "Access denied. Only Managers and SuperAdmins can access the store admin.",
      });
    }

    // Generate local admin token
    const adminToken = generateAdminToken({
      id: data.user.id || data.user._id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    });

    res.status(200).json({
      token: adminToken,
      user: {
        id: data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      },
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({ error: "Account is deactivated" });
    }
    console.error("Admin login error:", error.message);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
}
