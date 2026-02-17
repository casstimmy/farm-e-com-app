/**
 * Farm Manager API Client
 *
 * All communication with the farm-health-app goes through this module.
 * Uses a shared secret token for service-to-service authentication.
 */

const FARM_API_URL = process.env.FARM_API_URL || "http://localhost:3000";
const FARM_API_SECRET = process.env.FARM_API_SECRET;

async function farmRequest(path, options = {}) {
  const url = `${FARM_API_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Integration-Secret": FARM_API_SECRET,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error || `Farm API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch public products from the farm inventory system.
 */
export async function fetchPublicProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return farmRequest(`/api/integration/public-products?${query}`);
}

/**
 * Deduct stock from farm inventory after a confirmed payment.
 */
export async function deductStock(items) {
  return farmRequest("/api/integration/deduct-stock", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

/**
 * Register a completed e-commerce sale with the farm manager.
 */
export async function registerSale(orderData) {
  return farmRequest("/api/integration/register-sale", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

/**
 * Restore stock for a cancelled order.
 */
export async function restoreStock(items) {
  return farmRequest("/api/integration/restore-stock", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
