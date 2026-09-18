/**
 * Minimal fixed-window rate limiter — F-02 from the security audit
 * (unauthenticated brute-force / signup-abuse resistance on
 * /api/auth/signup and the Credentials login path).
 *
 * IMPORTANT — SCOPE OF THIS FIX:
 * This is in-memory, per-process state. It stops a single-instance
 * deployment (e.g. one long-lived Node server) from being brute-forced,
 * and it's enough to make scripted credential stuffing meaningfully
 * slower. It does NOT share state across multiple server instances or
 * survive a restart/redeploy, so it is NOT sufficient on its own for a
 * horizontally-scaled or serverless (e.g. Vercel Functions) production
 * deployment — there, each cold-started instance gets its own empty
 * counters. Before scaling past one instance, replace the Map below with
 * a shared store (Upstash Redis + @upstash/ratelimit is the standard
 * choice for Vercel) behind this same `rateLimit()` function signature
 * so callers don't need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

/** Opportunistic sweep of expired buckets so the Map doesn't grow forever. */
function cleanupIfDue(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller may retry. 0 when `allowed` is true. */
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter: at most `limit` calls per `windowMs` for a given
 * `key`. Callers choose the key (e.g. `login:${email}` or `ip:${ip}`) so
 * the same limiter can enforce both per-account and per-IP limits.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanupIfDue(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Clears a key's counter — used to reset the per-email login limit on a successful sign-in. */
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP from standard proxy headers. Trusts whatever
 * reverse proxy sits in front of the app (Vercel sets these reliably);
 * if you deploy behind a different proxy, verify it sets one of these
 * headers, or an attacker can freely spoof their apparent IP and bypass
 * the per-IP limit below (the per-account limit is unaffected either way).
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
