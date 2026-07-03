import "server-only";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let _redis: Redis | null = null;

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Upstash Redis client. Returns null if not configured.
 */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_redis) {
    _redis = new Redis({ url, token });
  }
  return _redis;
}

/**
 * Per-IP rate limiter for audit requests.
 * Falls back to "always allow" in demo mode.
 *   Free plan: 10 audits / hour
 *   Pro/Business: 100 audits / hour
 */
const LIMITERS: Record<string, Ratelimit> = {};

export function getRatelimit(plan: "free" | "pro" | "business" = "free"): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const limits = { free: 10, pro: 100, business: 1000 };
  const key = `${plan}:${limits[plan]}`;

  if (!LIMITERS[key]) {
    LIMITERS[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits[plan], "1 h"),
      prefix: `ratelimit:audit:${plan}`,
      analytics: true,
    });
  }
  return LIMITERS[key];
}

/**
 * Check rate limit for an identifier (IP or user ID).
 * Returns { success, limit, remaining, reset }.
 * In demo mode (no Redis), always succeeds.
 */
export async function checkRateLimit(
  identifier: string,
  plan: "free" | "pro" | "business" = "free"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = getRatelimit(plan);
  if (!limiter) {
    // Demo mode — allow everything.
    return { success: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }
  return limiter.limit(identifier);
}
