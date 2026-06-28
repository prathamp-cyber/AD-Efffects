import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { generateSessionToken, setSessionCookie } from './session';

const credentialsPath = path.join(process.cwd(), 'src', 'data', 'adminCredentials.json');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    let expectedUsername = process.env.ADMIN_USERNAME || 'AD EFFFECTS';
    let expectedPassword = process.env.ADMIN_PASSWORD || 'AD12345';

    try {
      const data = await fs.readFile(credentialsPath, 'utf8');
      const creds = JSON.parse(data);
      if (creds.username && creds.password) {
        expectedUsername = creds.username;
        expectedPassword = creds.password;
      }
    } catch {
      // Ignored if file does not exist
    }

    if (username === expectedUsername && password === expectedPassword) {
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
