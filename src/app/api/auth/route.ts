import { NextResponse } from 'next/server';
import { generateSessionToken, setSessionCookie } from './session';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === 'AD EFFFECTS' && password === 'AD12345') {
      const token = generateSessionToken(username);
      await setSessionCookie(token);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
