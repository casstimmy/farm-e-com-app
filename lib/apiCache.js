/**
 * Lightweight in-memory cache for API responses.
 *
 * Works in both serverless (Vercel) and long-running (Node) environments.
 * In serverless, the cache lives for the duration of the warm container
 * (typically 5–15 minutes), which still eliminates duplicate DB queries
 * within that window.
 *
 * Usage:
 *   const data = await withCache("settings", 300, async () => {
 *     return await BusinessSettings.findOne().lean();
 *   });
 */

const _cache = new Map();

/**
 * @param {string}   key     Unique cache key
 * @param {number}   ttlSec  Time-to-live in seconds
 * @param {Function} fetcher Async function that returns fresh data
 * @returns {Promise<any>}
 */
export async function withCache(key, ttlSec, fetcher) {
  const now = Date.now();
  const entry = _cache.get(key);

  if (entry && now < entry.expiresAt) {
    return entry.data;
  }

  const data = await fetcher();
  _cache.set(key, { data, expiresAt: now + ttlSec * 1000 });
  return data;
}

/**
 * Invalidate a single key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix) {
  if (_cache.has(keyOrPrefix)) {
    _cache.delete(keyOrPrefix);
    return;
  }
  // Prefix match
  for (const k of _cache.keys()) {
    if (k.startsWith(keyOrPrefix)) {
      _cache.delete(k);
    }
  }
}

/**
 * Clear entire cache (useful in tests / admin actions).
 */
export function clearCache() {
  _cache.clear();
}
