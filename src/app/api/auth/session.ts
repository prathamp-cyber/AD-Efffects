import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET_KEY = process.env.ADMIN_SESSION_SECRET || 'ad-effects-luxury-design-secret-key-2026';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function generateSessionToken(username: string): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(`${username}:${timestamp}`);
  const signature = hmac.digest('hex');
  return `${username}:${timestamp}:${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  
  try {
    const [username, timestamp, signature] = token.split(':');
    if (!username || !timestamp || !signature) return false;
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(`${username}:${timestamp}`);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) return false;
    
    // Verify expiration
    const timeElapsed = Date.now() - parseInt(timestamp, 10);
    if (timeElapsed > SESSION_EXPIRY || timeElapsed < 0) return false;
    
    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours in seconds
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
