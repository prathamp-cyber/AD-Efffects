import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../session';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
