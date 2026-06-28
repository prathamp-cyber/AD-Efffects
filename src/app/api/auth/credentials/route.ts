import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionCookie, verifySessionToken } from '../session';

const credentialsPath = path.join(process.cwd(), 'src', 'data', 'adminCredentials.json');

export async function GET() {
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let credentials = {
      username: process.env.ADMIN_USERNAME || 'AD EFFFECTS',
      password: process.env.ADMIN_PASSWORD || 'AD12345',
      email: 'admin@adefffects.com'
    };

    try {
      const data = await fs.readFile(credentialsPath, 'utf8');
      const creds = JSON.parse(data);
      if (creds.username) credentials.username = creds.username;
      if (creds.password) credentials.password = creds.password;
      if (creds.email) credentials.email = creds.email;
    } catch {
      // Return defaults if file doesn't exist yet
    }

    return NextResponse.json(credentials);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve credentials' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password, email } = await request.json();

    if (!username || !password || !email) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (username.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const credentials = {
      username: username.trim(),
      password: password.trim(),
      email: email.toLowerCase().trim()
    };

    // Ensure data directory exists
    const dataDir = path.dirname(credentialsPath);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}

    await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
  }
}
