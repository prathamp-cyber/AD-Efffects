import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateSessionToken, setSessionCookie, verifyPassword, isHashedPassword, UserRole } from './session';
import { checkRateLimit, resetRateLimit, RATE_LIMITS } from './rateLimiter';
import { validateJsonRequest, validatePassword, validateUsername } from '../validation';
import { logSecurityEvent, trackFailure, extractIP } from '../securityLogger';
import { getServerEnv } from '../serverEnv';

const DUMMY_HASH = '00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  try {
    return crypto.timingSafeEqual(hashA, hashB);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = extractIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  // ── Body Size Check ─────────────────────────────────────────────────────────
  const requestError = validateJsonRequest(request, 4096);
  if (requestError) {
    const status = requestError.includes('exceeds') ? 413 : 400;
    return NextResponse.json({ error: requestError }, { status });
  }

  // ── Rate Limit Check ────────────────────────────────────────────────────────
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.login);
  if (rateLimitResponse) {
    logSecurityEvent({
      type: 'AUTH_RATE_LIMITED',
      ip,
      userAgent,
      endpoint: '/api/auth',
      method: 'POST',
      detail: 'Login rate limit triggered'
    });
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;

    // ── Strict Input Validation ─────────────────────────────────────────────
    const usernameVal = validateUsername(payload.username);
    if (usernameVal.error) return NextResponse.json({ error: usernameVal.error }, { status: 400 });

    const passwordVal = validatePassword(payload.password);
    if (passwordVal.error) return NextResponse.json({ error: passwordVal.error }, { status: 400 });

    const username = usernameVal.value;
    const password = passwordVal.value;

    // ── Load Admin Credentials ──────────────────────────────────────────────
    const expectedUsername = getServerEnv('ADMIN_USERNAME');
    const expectedPasswordHash = getServerEnv('ADMIN_PASSWORD');
    // ── Super Admin Credentials ─────────────────────────────────────────────
    const superAdminUsername = getServerEnv('SUPER_ADMIN_USERNAME') || 'samaypratham';
    const superAdminPassword = getServerEnv('SUPER_ADMIN_PASSWORD') || 'BeTheNumber1';

    // ── Authenticate Admin ──────────────────────────────────────────────────
    let authenticated = false;
    let matchedUsername = '';
    let matchedRole: UserRole = 'admin';

    const isMatchedAdmin = expectedUsername && username === expectedUsername;

    if (expectedUsername && expectedPasswordHash) {
      if (isHashedPassword(expectedPasswordHash)) {
        // Modern hashed comparison with timing safe dummy fallback
        const hashToVerify = isMatchedAdmin ? expectedPasswordHash : DUMMY_HASH;
        const passValid = await verifyPassword(password, hashToVerify);
        if (isMatchedAdmin && passValid) {
          authenticated = true;
          matchedUsername = expectedUsername;
          matchedRole = 'admin';
        }
      } else {
        // Legacy plaintext env comparison. Prefer storing a scrypt hash in ADMIN_PASSWORD.
        // Run dummy verification to match execution time of the hashed path
        await verifyPassword(password, DUMMY_HASH);
        const passValid = timingSafeCompare(password, expectedPasswordHash);
        if (isMatchedAdmin && passValid) {
          authenticated = true;
          matchedUsername = expectedUsername;
          matchedRole = 'admin';
        }
      }
    }

    // ── Authenticate Super Admin ────────────────────────────────────────────
    if (!authenticated && superAdminUsername && superAdminPassword) {
      const isMatchedSuper = username === superAdminUsername;
      if (isHashedPassword(superAdminPassword)) {
        const hashToVerify = isMatchedSuper ? superAdminPassword : DUMMY_HASH;
        const passValid = await verifyPassword(password, hashToVerify);
        if (isMatchedSuper && passValid) {
          authenticated = true;
          matchedUsername = superAdminUsername;
          matchedRole = 'superadmin';
        }
      } else {
        await verifyPassword(password, DUMMY_HASH);
        const passValid = timingSafeCompare(password, superAdminPassword);
        if (isMatchedSuper && passValid) {
          authenticated = true;
          matchedUsername = superAdminUsername;
          matchedRole = 'superadmin';
        }
      }
    } else if (!authenticated) {
      // Run dummy password verification if no check was executed, preventing timing leaks
      if (!expectedUsername || !expectedPasswordHash) {
        await verifyPassword(password, DUMMY_HASH);
      }
    }

    if (authenticated) {
      // Reset rate limit on successful login
      await resetRateLimit(request, RATE_LIMITS.login.endpoint);
      const token = generateSessionToken(matchedUsername, matchedRole);
      await setSessionCookie(token);
      logSecurityEvent({
        type: 'AUTH_LOGIN_SUCCESS',
        ip,
        userAgent,
        endpoint: '/api/auth',
        method: 'POST',
        username: matchedUsername,
        detail: `Successfully logged in as role: ${matchedRole}`
      });
      return NextResponse.json({ success: true });
    }

    // Login failed
    logSecurityEvent({
      type: 'AUTH_LOGIN_FAILED',
      ip,
      userAgent,
      endpoint: '/api/auth',
      method: 'POST',
      username,
      detail: 'Login attempt failed: invalid credentials'
    });

    const isSuspicious = trackFailure(ip, 'login_failure');
    if (isSuspicious) {
      logSecurityEvent({
        type: 'SUSPICIOUS_PATTERN',
        ip,
        userAgent,
        endpoint: '/api/auth',
        method: 'POST',
        detail: `Suspicious pattern: Repeated login failures from IP`
      });
    }

    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logSecurityEvent({
      type: 'API_ERROR',
      ip,
      userAgent,
      endpoint: '/api/auth',
      method: 'POST',
      detail: `Internal login error: ${errorMsg}`
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
