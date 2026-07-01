import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getServerEnv } from '../serverEnv';

// ─── Session Configuration ────────────────────────────────────────────────────
let _warnedMissingSecret = false;
const SECRET_KEY = getServerEnv('ADMIN_SESSION_SECRET') || (() => {
  // Warn once in production if no secret is set
  if (getServerEnv('NODE_ENV') === 'production' && !_warnedMissingSecret) {
    _warnedMissingSecret = true;
    console.error(
      '[SECURITY WARNING] ADMIN_SESSION_SECRET is not set. Using a random ephemeral key. ' +
      'Sessions will NOT survive server restarts. Set ADMIN_SESSION_SECRET in your environment.'
    );
  }
  // Generate a random key for this process lifetime (safe for development)
  return crypto.randomBytes(32).toString('hex');
})();

const SESSION_EXPIRY = 8 * 60 * 60 * 1000; // 8 hours (reduced from 24h)

// ─── Password Hashing (scrypt, zero dependencies) ────────────────────────────

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384; // N — CPU/memory cost
const SCRYPT_BLOCK_SIZE = 8; // r
const SCRYPT_PARALLELIZATION = 1; // p

/**
 * Hash a plaintext password using scrypt with a random salt.
 * Returns a string in the format: `salt:hash` (both hex-encoded).
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      plaintext,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELIZATION },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(`${salt}:${derivedKey.toString('hex')}`);
      }
    );
  });
}

/**
 * Verify a plaintext password against a stored `salt:hash` string.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function verifyPassword(plaintext: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  return new Promise((resolve, reject) => {
    crypto.scrypt(
      plaintext,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELIZATION },
      (err, derivedKey) => {
        if (err) reject(err);
        else {
          try {
            const hashBuffer = Buffer.from(hash, 'hex');
            resolve(crypto.timingSafeEqual(derivedKey, hashBuffer));
          } catch {
            resolve(false);
          }
        }
      }
    );
  });
}

/**
 * Detect whether a stored password string is a scrypt hash (salt:hex format)
 * versus a legacy plaintext password.
 */
export function isHashedPassword(stored: string): boolean {
  // A scrypt hash has the format `<32-char hex salt>:<128-char hex hash>`
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  return parts[0].length === 32 && parts[1].length === (SCRYPT_KEYLEN * 2);
}

// ─── Session Token Management ─────────────────────────────────────────────────

export type UserRole = 'admin' | 'superadmin';

export function generateSessionToken(username: string, role: UserRole = 'admin'): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(`${username}:${role}:${timestamp}`);
  const signature = hmac.digest('hex');
  return `${username}:${role}:${timestamp}:${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  
  try {
    const parts = token.split(':');
    if (parts.length !== 4) return false;
    const [username, role, timestamp, signature] = parts;
    if (!username || !role || !timestamp || !signature) return false;
    if (role !== 'admin' && role !== 'superadmin') return false;
    
    // Verify signature using timing-safe comparison
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(`${username}:${role}:${timestamp}`);
    const expectedSignature = hmac.digest('hex');
    
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return false;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false;
    
    // Verify expiration
    const timeElapsed = Date.now() - parseInt(timestamp, 10);
    if (timeElapsed > SESSION_EXPIRY || timeElapsed < 0) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract the role from a verified session token.
 * MUST only be called after verifySessionToken() returns true.
 */
export function getSessionRole(token: string | undefined): UserRole | null {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 4) return null;
  const role = parts[1];
  if (role === 'admin' || role === 'superadmin') return role;
  return null;
}

/**
 * Extract the username from a verified session token.
 * MUST only be called after verifySessionToken() returns true.
 */
export function getSessionUsername(token: string | undefined): string {
  if (!token) return 'Unknown';
  const parts = token.split(':');
  if (parts.length !== 4) return 'Unknown';
  return parts[0] || 'Unknown';
}

/**
 * Verify session and check that the user has the required role.
 * Returns { authorized: true, username, role } or { authorized: false }.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<{ authorized: true; username: string; role: UserRole } | { authorized: false }> {
  const token = await getSessionCookie();
  if (!verifySessionToken(token)) return { authorized: false };
  const role = getSessionRole(token);
  if (!role || !allowedRoles.includes(role)) return { authorized: false };
  const username = getSessionUsername(token);
  return { authorized: true, username, role };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: getServerEnv('NODE_ENV') === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 // 8 hours in seconds
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}
