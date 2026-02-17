const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX = 60;
const MAX_BUCKETS = 10000;

function getStore() {
  if (!global.__webPlaceRateLimitStore) {
    global.__webPlaceRateLimitStore = new Map();
  }
  return global.__webPlaceRateLimitStore;
}

function getClientIp(req) {
  const header = req.headers["x-forwarded-for"];
  if (typeof header === "string" && header.length > 0) {
    return header.split(",")[0].trim();
  }
  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

function cleanupStore(store, now) {
  for (const [key, value] of store) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size <= MAX_BUCKETS) return;

  const oldestKeys = [...store.entries()]
    .sort((a, b) => a[1].resetAt - b[1].resetAt)
    .slice(0, store.size - MAX_BUCKETS);

  for (const [key] of oldestKeys) {
    store.delete(key);
  }
}

function setRateLimitHeaders(res, { max, remaining, resetAt, retryAfterSec }) {
  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));
  if (retryAfterSec !== undefined) {
    res.setHeader("Retry-After", String(Math.max(1, retryAfterSec)));
  }
}

/**
 * Wrap a Next.js API route with a lightweight in-memory rate limiter.
 *
 * Note: per-instance limiter; for multi-instance deployments use Redis or edge rate limiting.
 */
export function withRateLimit(options, handler) {
  const {
    keyPrefix = "api",
    windowMs = DEFAULT_WINDOW_MS,
    max = DEFAULT_MAX,
    methods = null,
    keyGenerator,
  } = options || {};

  return async function rateLimitedHandler(req, res) {
    if (Array.isArray(methods) && methods.length > 0 && !methods.includes(req.method)) {
      return handler(req, res);
    }

    const now = Date.now();
    const store = getStore();
    cleanupStore(store, now);

    const keyPart = keyGenerator
      ? keyGenerator(req)
      : getClientIp(req);
    const key = `${keyPrefix}:${keyPart}`;

    const current = store.get(key);
    let bucket;

    if (!current || current.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      store.set(key, bucket);
    } else {
      bucket = current;
    }

    if (bucket.count >= max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      setRateLimitHeaders(res, {
        max,
        remaining: 0,
        resetAt: bucket.resetAt,
        retryAfterSec,
      });
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    bucket.count += 1;
    setRateLimitHeaders(res, {
      max,
      remaining: max - bucket.count,
      resetAt: bucket.resetAt,
    });

    return handler(req, res);
  };
}

