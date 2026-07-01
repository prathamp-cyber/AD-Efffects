/**
 * Security Event Logger
 * 
 * Structured logging for authentication attempts, API errors,
 * rate limit hits, bot blocks, and unusual traffic patterns.
 * 
 * In production, these logs are written to stdout in JSON format
 * so they can be captured by Vercel's log drain, Datadog, or any
 * log aggregation service.
 */

export type SecurityEventType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_RATE_LIMITED'
  | 'AUTH_OTP_REQUESTED'
  | 'AUTH_OTP_FAILED'
  | 'AUTH_OTP_VERIFIED'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_CREDENTIALS_UPDATED'
  | 'RATE_LIMIT_HIT'
  | 'BOT_BLOCKED'
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED_ACCESS'
  | 'SUSPICIOUS_PATTERN'
  | 'API_ERROR'
  | 'UPLOAD_BLOCKED'
  | 'HTTPS_REDIRECT';

export interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  username?: string;
  detail?: string;
  timestamp: string;
}

// ─── Suspicious Pattern Detection ─────────────────────────────────────────────

interface FailureTracker {
  count: number;
  firstSeen: number;
  lastSeen: number;
}

const failureTracker = new Map<string, FailureTracker>();
const PATTERN_WINDOW_MS = 30 * 60 * 1000; // 30-minute window
const SUSPICIOUS_THRESHOLD = 10; // 10+ failures in window = suspicious
let lastPatternCleanup = Date.now();

function cleanupPatternTracker() {
  const now = Date.now();
  if (now - lastPatternCleanup < 5 * 60 * 1000) return; // cleanup every 5 min
  lastPatternCleanup = now;
  for (const [key, tracker] of failureTracker) {
    if (now - tracker.lastSeen > PATTERN_WINDOW_MS) {
      failureTracker.delete(key);
    }
  }
}

/**
 * Track a failure event from an IP and detect suspicious patterns.
 * Returns true if the IP has crossed the suspicious threshold.
 */
export function trackFailure(ip: string, eventType: string): boolean {
  cleanupPatternTracker();
  const key = `${eventType}:${ip}`;
  const now = Date.now();
  const existing = failureTracker.get(key);

  if (!existing || (now - existing.firstSeen > PATTERN_WINDOW_MS)) {
    failureTracker.set(key, { count: 1, firstSeen: now, lastSeen: now });
    return false;
  }

  existing.count += 1;
  existing.lastSeen = now;

  return existing.count >= SUSPICIOUS_THRESHOLD;
}

/**
 * Get the current failure count for an IP + event type.
 */
export function getFailureCount(ip: string, eventType: string): number {
  const key = `${eventType}:${ip}`;
  const existing = failureTracker.get(key);
  if (!existing) return 0;
  const now = Date.now();
  if (now - existing.firstSeen > PATTERN_WINDOW_MS) return 0;
  return existing.count;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/**
 * Log a security event in structured JSON format.
 * 
 * In production, these go to stdout where Vercel/hosting provider
 * can capture them via log drain for monitoring and alerting.
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Redact sensitive fields
  if (fullEvent.username) {
    // Don't log full usernames in production — mask them
    if (fullEvent.username.length > 3) {
      fullEvent.username = fullEvent.username.substring(0, 2) + '***';
    }
  }

  // Use structured JSON logging for production log aggregation
  const logLine = JSON.stringify({
    level: getLogLevel(event.type),
    category: 'SECURITY',
    ...fullEvent,
  });

  // Route to appropriate console method based on severity
  const level = getLogLevel(event.type);
  if (level === 'error') {
    console.error(logLine);
  } else if (level === 'warn') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }
}

function getLogLevel(type: SecurityEventType): 'info' | 'warn' | 'error' {
  switch (type) {
    case 'AUTH_LOGIN_SUCCESS':
    case 'AUTH_LOGOUT':
    case 'AUTH_OTP_VERIFIED':
    case 'AUTH_PASSWORD_RESET':
    case 'AUTH_CREDENTIALS_UPDATED':
    case 'HTTPS_REDIRECT':
      return 'info';
    case 'AUTH_LOGIN_FAILED':
    case 'AUTH_OTP_REQUESTED':
    case 'AUTH_OTP_FAILED':
    case 'AUTH_RATE_LIMITED':
    case 'RATE_LIMIT_HIT':
    case 'BOT_BLOCKED':
    case 'INVALID_INPUT':
    case 'UPLOAD_BLOCKED':
      return 'warn';
    case 'UNAUTHORIZED_ACCESS':
    case 'SUSPICIOUS_PATTERN':
    case 'API_ERROR':
      return 'error';
    default:
      return 'info';
  }
}

// ─── Helpers for Route Handlers ───────────────────────────────────────────────

/**
 * Extract client IP from a Request object (works in both middleware and route handlers).
 */
export function extractIP(request: Request): string {
  const headers = new Headers(request.headers);
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
