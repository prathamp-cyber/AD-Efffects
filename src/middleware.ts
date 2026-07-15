import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logSecurityEvent } from './app/api/securityLogger';

/**
 * Global abuse protection middleware.
 * Applies rate limiting, bot detection, and scraping protection
 * to all API endpoints and page routes.
 * 
 * Runs at the edge before any route handler executes.
 */

// ─── In-Memory Rate Limit Store ───────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const globalStore = new Map<string, RateLimitEntry>();
let lastGlobalCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // cleanup every 60 seconds

function cleanup() {
  const now = Date.now();
  if (now - lastGlobalCleanup < CLEANUP_INTERVAL) return;
  lastGlobalCleanup = now;
  for (const [key, entry] of globalStore) {
    if (now - entry.windowStart > 15 * 60 * 1000) {
      globalStore.delete(key);
    }
  }
}

function isRateLimited(key: string, maxRequests: number, windowMs: number): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  cleanup();

  const entry = globalStore.get(key);
  if (!entry || (now - entry.windowStart > windowMs)) {
    globalStore.set(key, { count: 1, windowStart: now });
    return { limited: false, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

// ─── IP Extraction ────────────────────────────────────────────────────────────

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

// ─── Bot Detection ────────────────────────────────────────────────────────────

/** Known bot/scraper user-agent patterns to block from API endpoints */
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scrape/i, /curl/i, /wget/i,
  /python-requests/i, /httpie/i, /postmanruntime/i,
  /go-http-client/i, /java\//i, /libwww/i, /scrapy/i,
  /phantom/i, /headless/i, /puppeteer/i, /selenium/i,
];

/** Legitimate bot user-agents we should NOT block (search engines for public pages) */
const ALLOWED_BOTS = [
  /googlebot/i, /bingbot/i, /yandexbot/i, /duckduckbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /slurp/i, /applebot/i,
];

function isBlockedBot(userAgent: string | null, pathname: string): boolean {
  if (!userAgent) return false;

  // Allow legitimate search engine bots on public pages (not API)
  if (!pathname.startsWith('/api/')) {
    if (ALLOWED_BOTS.some(p => p.test(userAgent))) return false;
  }

  // Block known scraper/automation tools from API endpoints
  if (pathname.startsWith('/api/')) {
    return BOT_PATTERNS.some(p => p.test(userAgent));
  }

  return false;
}

// ─── Rate Limit Profiles ──────────────────────────────────────────────────────

interface RateLimitProfile {
  maxRequests: number;
  windowMs: number;
}

/** Per-endpoint rate limit configuration */
const ENDPOINT_LIMITS: Record<string, RateLimitProfile> = {
  // Auth endpoints (strict — already have per-route limits, this is a secondary layer)
  '/api/auth': { maxRequests: 10, windowMs: 15 * 60 * 1000 },           // 10 login attempts / 15min
  '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 },    // 3 registration attempts / hour
  '/api/ai': { maxRequests: 5, windowMs: 15 * 60 * 1000 },               // 5 AI generation requests / 15min
  '/api/auth/credentials': { maxRequests: 10, windowMs: 5 * 60 * 1000 },

  // Public form submission (contact form — most abused)
  '/api/inquiries': { maxRequests: 5, windowMs: 10 * 60 * 1000 },       // 5 submissions / 10min

  // Config updates (admin)
  '/api/config': { maxRequests: 30, windowMs: 5 * 60 * 1000 },          // 30 saves / 5min

  // File uploads (admin)
  '/api/upload': { maxRequests: 20, windowMs: 5 * 60 * 1000 },          // 20 uploads / 5min

  // Audit logs (read-only)
  '/api/logs': { maxRequests: 30, windowMs: 5 * 60 * 1000 },            // 30 reads / 5min

  // Auth check (lightweight — higher limit)
  '/api/auth/check': { maxRequests: 60, windowMs: 5 * 60 * 1000 },
  '/api/auth/logout': { maxRequests: 10, windowMs: 5 * 60 * 1000 },
};

/** Global fallback for any API route not explicitly listed */
const DEFAULT_API_LIMIT: RateLimitProfile = { maxRequests: 60, windowMs: 5 * 60 * 1000 };

/** Global rate limit for all requests from a single IP (anti-scraping) */
const GLOBAL_LIMIT: RateLimitProfile = { maxRequests: 300, windowMs: 5 * 60 * 1000 }; // 300 req / 5min total

// ─── Security Headers ─────────────────────────────────────────────────────────

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy — disable unused browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  return response;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIP(request);
  const userAgent = request.headers.get('user-agent');
  const method = request.method;

  // ── 0. HTTPS Enforcement in Production ───────────────────────────────────
  const isProd = process.env.NODE_ENV === 'production';
  const proto = request.headers.get('x-forwarded-proto');
  if (isProd && proto === 'http') {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = 'https:';
    logSecurityEvent({
      type: 'HTTPS_REDIRECT',
      ip,
      userAgent: userAgent || undefined,
      endpoint: pathname,
      method,
      detail: `Redirecting ${request.url} to HTTPS`
    });
    return addSecurityHeaders(NextResponse.redirect(secureUrl.toString(), 301));
  }

  // ── 1. Bot Detection (API endpoints only) ───────────────────────────────
  if (isBlockedBot(userAgent, pathname)) {
    logSecurityEvent({
      type: 'BOT_BLOCKED',
      ip,
      userAgent: userAgent || undefined,
      endpoint: pathname,
      method,
      detail: `Blocked scraper/bot signature`
    });
    return addSecurityHeaders(NextResponse.json(
      { error: 'Automated access is not permitted' },
      { status: 403 }
    ));
  }

  // ── 2. Block requests with no User-Agent on API write endpoints ─────────
  if (!userAgent && pathname.startsWith('/api/') && method !== 'GET') {
    logSecurityEvent({
      type: 'BOT_BLOCKED',
      ip,
      endpoint: pathname,
      method,
      detail: `Blocked API request with empty/missing User-Agent`
    });
    return addSecurityHeaders(NextResponse.json(
      { error: 'Request rejected' },
      { status: 403 }
    ));
  }

  // ── 3. Global rate limit (anti-scraping — all requests from one IP) ─────
  const adminSession = request.cookies.get('admin_session')?.value;
  const effectiveGlobalMax = adminSession ? 10000 : GLOBAL_LIMIT.maxRequests;
  const globalCheck = isRateLimited(`global:${ip}`, effectiveGlobalMax, GLOBAL_LIMIT.windowMs);
  if (globalCheck.limited) {
    logSecurityEvent({
      type: 'RATE_LIMIT_HIT',
      ip,
      userAgent: userAgent || undefined,
      endpoint: pathname,
      method,
      detail: `Global IP rate limit hit (${effectiveGlobalMax}/${GLOBAL_LIMIT.windowMs}ms)`
    });
    const res = NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(globalCheck.retryAfter) } }
    );
    return addSecurityHeaders(res);
  }

  // ── 4. Per-endpoint rate limit (API routes only) ────────────────────────
  if (pathname.startsWith('/api/')) {
    const profile = ENDPOINT_LIMITS[pathname] || DEFAULT_API_LIMIT;

    // For GET requests, use a higher multiplier (reads are cheaper)
    // For logged-in admins, greatly increase limits to allow batch photo uploads
    const effectiveMax = adminSession 
      ? 5000 
      : (method === 'GET' ? profile.maxRequests * 2 : profile.maxRequests);

    const check = isRateLimited(`ep:${pathname}:${ip}`, effectiveMax, profile.windowMs);
    if (check.limited) {
      logSecurityEvent({
        type: 'RATE_LIMIT_HIT',
        ip,
        userAgent: userAgent || undefined,
        endpoint: pathname,
        method,
        detail: `Endpoint rate limit hit for ${pathname} (${effectiveMax}/${profile.windowMs}ms)`
      });
      const res = NextResponse.json(
        { error: 'Rate limit exceeded for this endpoint. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(check.retryAfter) } }
      );
      return addSecurityHeaders(res);
    }
  }

  // ── 5. Add security headers to all responses ───────────────────────────
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// Apply middleware to all API routes and page routes.
// Exclude static assets, images, and Next.js internals.
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)',
  ],
};
