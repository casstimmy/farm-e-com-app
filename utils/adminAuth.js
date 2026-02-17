import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

/**
 * Generate an admin token for Web_Place admin dashboard.
 * Called after verifying credentials via farm-health-app.
 */
export function generateAdminToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    ADMIN_JWT_SECRET,
    { expiresIn: "8h" }
  );
}

/**
 * Verify an admin token.
 */
export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Middleware: Protect admin API routes.
 * Checks Authorization header for Bearer token and verifies it.
 * Sets req.user with { id, email, name, role }.
 */
export function withAdminAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAdminToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired admin token" });
    }

    req.user = decoded;
    return handler(req, res);
  };
}
