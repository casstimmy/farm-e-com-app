import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const CUSTOMER_TOKEN_PREFIX = "customer";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

/**
 * Generate a JWT token for a customer.
 */
export function generateCustomerToken(customer) {
  return jwt.sign(
    {
      id: customer._id,
      email: customer.email,
      type: CUSTOMER_TOKEN_PREFIX,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

/**
 * Verify a customer JWT token.
 */
export function verifyCustomerToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== CUSTOMER_TOKEN_PREFIX) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from the Authorization header.
 */
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

/**
 * API middleware: require a valid customer token.
 * Attaches `req.customer` with `{ id, email }`.
 */
export function withCustomerAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No token provided" });
    }

    const decoded = verifyCustomerToken(token);
    if (!decoded) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    req.customer = { id: decoded.id, email: decoded.email };
    return handler(req, res);
  };
}

/**
 * API middleware: allow optionally authenticated customers.
 */
export function withOptionalCustomerAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    if (token) {
      const decoded = verifyCustomerToken(token);
      req.customer = decoded ? { id: decoded.id, email: decoded.email } : null;
    } else {
      req.customer = null;
    }
    return handler(req, res);
  };
}
