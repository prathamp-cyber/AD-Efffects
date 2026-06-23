import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import defaultConfig from '@/data/siteConfig.json';
import { getSessionCookie, verifySessionToken } from '../auth/session';

const configPath = path.join(process.cwd(), 'src', 'data', 'siteConfig.json');

export async function GET() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    return NextResponse.json(config);
  } catch {
    // If reading from file system fails (e.g., file not found or build-time),
    // return the statically imported default config.
    return NextResponse.json(defaultConfig);
  }
}

export async function POST(request: Request) {
  // Check auth
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newConfig = await request.json();
    
    // Write back to config file
    try {
      await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      return NextResponse.json({ success: true, persisted: true });
    } catch (fsError) {
      console.warn('Failed to write configuration to file system:', fsError);
      return NextResponse.json({ 
        success: true, 
        persisted: false,
        warning: 'Configuration updated, but the file system is read-only (e.g. Vercel deployment). Please download the configuration file from the admin panel and commit it to your repository to make the changes permanent.'
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
