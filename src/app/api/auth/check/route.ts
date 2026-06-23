import { NextResponse } from 'next/server';
import { getSessionCookie, verifySessionToken } from '../session';

export async function GET() {
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  return NextResponse.json({ authenticated: isValid });
}
