import { NextResponse } from 'next/server';
import { requireRole } from '../../auth/session';
import { saveConfig } from '../../dbAdapter';
import defaultConfig from '@/data/siteConfig.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Require logged-in admin session
  const auth = await requireRole('admin', 'superadmin');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await saveConfig(defaultConfig as unknown as Record<string, unknown>);
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully synchronized database with local siteConfig.json!' 
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to sync database: ' + msg }, { status: 500 });
  }
}
