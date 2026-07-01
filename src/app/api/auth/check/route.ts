import { NextResponse } from 'next/server';
import { getSessionCookie, verifySessionToken, getSessionRole } from '../session';

export async function GET() {
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  const role = isValid ? getSessionRole(token) : null;
  return NextResponse.json({ authenticated: isValid, role });
}
