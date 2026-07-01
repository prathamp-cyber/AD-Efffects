import { NextResponse } from 'next/server';
import { getAuditLogs } from './db';
import { requireRole } from '../auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Both admin and superadmin can view audit logs
  const auth = await requireRole('admin', 'superadmin');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs = await getAuditLogs();
    return NextResponse.json(logs);
  } catch (err) {
    console.error('Failed to retrieve audit logs:', err);
    return NextResponse.json({ error: 'Failed to retrieve logs' }, { status: 500 });
  }
}
