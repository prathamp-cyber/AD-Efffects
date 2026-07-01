import { NextResponse } from 'next/server';
import { runRedisCommand } from '../dbAdapter';
import { getServerEnv } from '../serverEnv';

/**
 * Distributed rate limiter with in-memory fallback.
 * Uses Upstash Redis when configured to survive serverless scale-outs/restarts,
 * and falls back to an in-memory Map for offline local development.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Global store for in-memory fallback
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs * 2) {
      store.delete(key);
    }
  }
}

/**
 * Extract the client IP from the request headers.
 */
function getClientIP(request: Request): string {
  const headers = new Headers(request.headers);
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  endpoint: string;
}

export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, endpoint: 'login' } as RateLimitConfig,
  inquiry: { maxAttempts: 3, windowMs: 10 * 60 * 1000, endpoint: 'inquiry' } as RateLimitConfig,
  configUpdate: { maxAttempts: 30, windowMs: 5 * 60 * 1000, endpoint: 'config' } as RateLimitConfig,
  upload: { maxAttempts: 20, windowMs: 5 * 60 * 1000, endpoint: 'upload' } as RateLimitConfig,
};

/**
 * Check rate limit for a request. Returns null if within limits,
 * or a NextResponse (429) if the limit is exceeded.
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // Bypass rate limiting in local development to prevent lockouts during testing
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  const ip = getClientIP(request);
  const key = `${config.endpoint}:${ip}`;
  const now = Date.now();

  // 1. Try Redis-backed rate limiter if configured
  if (getServerEnv('UPSTASH_REDIS_REST_URL') && getServerEnv('UPSTASH_REDIS_REST_TOKEN')) {
    try {
      const redisKey = `ratelimit:${config.endpoint}:${ip}`;
      const result = await runRedisCommand(['INCR', redisKey]);
      const count = typeof result === 'number' ? result : parseInt(String(result), 10);

      if (count === 1) {
        const windowSeconds = Math.ceil(config.windowMs / 1000);
        await runRedisCommand(['EXPIRE', redisKey, String(windowSeconds)]);
      }

      if (count > config.maxAttempts) {
        const ttlResult = await runRedisCommand(['TTL', redisKey]);
        const ttl = typeof ttlResult === 'number' ? ttlResult : parseInt(String(ttlResult), 10);
        const retryAfterSeconds = ttl > 0 ? ttl : Math.ceil(config.windowMs / 1000);

        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSeconds),
            },
          }
        );
      }

      return null;
    } catch (redisErr) {
      console.warn('[SECURITY] Redis rate limiter failed, falling back to in-memory:', redisErr);
    }
  }

  // 2. Fallback: In-memory rate limiting
  cleanupExpiredEntries(config.windowMs);
  const entry = store.get(key);

  if (!entry || (now - entry.windowStart > config.windowMs)) {
    store.set(key, { count: 1, windowStart: now });
    return null;
  }

  entry.count += 1;

  if (entry.count > config.maxAttempts) {
    const retryAfterSeconds = Math.ceil(
      (config.windowMs - (now - entry.windowStart)) / 1000
    );
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  return null;
}

/**
 * Reset rate limit for a given client IP + endpoint.
 */
export async function resetRateLimit(request: Request, endpoint: string): Promise<void> {
  const ip = getClientIP(request);
  const key = `${endpoint}:${ip}`;

  if (getServerEnv('UPSTASH_REDIS_REST_URL') && getServerEnv('UPSTASH_REDIS_REST_TOKEN')) {
    try {
      const redisKey = `ratelimit:${endpoint}:${ip}`;
      await runRedisCommand(['DEL', redisKey]);
    } catch (redisErr) {
      console.warn('[SECURITY] Redis reset rate limit failed:', redisErr);
    }
  }

  store.delete(key);
}
