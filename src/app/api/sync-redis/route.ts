import { NextResponse } from 'next/server';
import { saveConfig } from '../dbAdapter';
import defaultConfig from '@/data/siteConfig.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Secure the endpoint using the ADMIN_PASSWORD value
  if (secret !== 'THEADEFFFECT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await saveConfig(defaultConfig as unknown as Record<string, unknown>);
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully seeded Vercel Redis database with local siteConfig.json!' 
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to sync Redis: ' + msg }, { status: 500 });
  }
}
