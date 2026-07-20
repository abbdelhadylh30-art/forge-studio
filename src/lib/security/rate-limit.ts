/**
 * In-memory sliding-window rate limiter.
 *
 * SWEBOK KA 3 §4.3 (Defensive Programming) + KA 2 §2.7 (Security): the AI copy
 * endpoint wraps a paid LLM call. Without rate limiting, a client-side loop
 * could hammer the endpoint and amplify cost. This limiter uses a sliding
 * window per identifier (typically the client IP) and is intentionally
 * in-memory — sufficient for a single-instance deployment. For multi-instance,
 * swap the `Map` for Redis (see ARCHITECTURE.md §7).
 *
 * The limiter is O(1) amortized: each check trims expired entries from the
 * caller's bucket only.
 */

interface Bucket {
  /** Timestamps of requests within the current window. */
  hits: number[];
}

export interface RateLimitOptions {
  /** Unique identifier for the caller (e.g. IP address). */
  key: string;
  /** Maximum number of requests allowed in the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Milliseconds until the oldest hit expires (useful for Retry-After). */
  retryAfterMs: number;
}

// Module-level store. Cleared only on process restart.
const buckets = new Map<string, Bucket>();

/** Extract a client IP from a Next.js request, preferring XFF/X-Real-IP. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const xReal = req.headers.get("x-real-ip");
  if (xReal) return xReal.trim();
  // Next.js dev server doesn't set these; fall back to a sentinel so all
  // local requests share a bucket (acceptable for dev).
  return "127.0.0.1";
}

/**
 * Check whether a request is allowed under the rate limit.
 * Callers should pass the result to a Retry-After header when `allowed` is false.
 */
export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  let bucket = buckets.get(opts.key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(opts.key, bucket);
  }

  // Drop hits outside the sliding window.
  bucket.hits = bucket.hits.filter((t) => t > windowStart);

  if (bucket.hits.length >= opts.limit) {
    const oldest = bucket.hits[0]!;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1, oldest + opts.windowMs - now),
    };
  }

  bucket.hits.push(now);
  return {
    allowed: true,
    remaining: opts.limit - bucket.hits.length,
    retryAfterMs: 0,
  };
}

/** Test-only: clear all buckets. */
export function _resetRateLimitForTests(): void {
  buckets.clear();
}
