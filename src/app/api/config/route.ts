import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '../auth/session';
import { addAuditLog } from '../logs/db';
import type { SiteConfig } from '@/data';
import { validateJsonRequest, validateSiteConfig } from '../validation';
import { checkRateLimit, RATE_LIMITS } from '../auth/rateLimiter';
import { getConfig, saveConfig } from '../dbAdapter';
import defaultConfig from '@/data/siteConfig.json';

let runtimeConfig: unknown = null;

export const dynamic = 'force-dynamic';

function jsonConfig(config: unknown) {
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function generateDiffLogs(oldCfg: SiteConfig, newCfg: SiteConfig): string[] {
  const logs: string[] = [];
  if (!oldCfg || !newCfg) return ['Updated site configuration'];

  // 1. Compare projects
  const oldProjects = oldCfg.projects || [];
  const newProjects = newCfg.projects || [];
  if (oldProjects.length !== newProjects.length) {
    if (newProjects.length > oldProjects.length) {
      const added = newProjects.filter((np) => !oldProjects.some((op) => op.id === np.id));
      added.forEach((p) => logs.push(`Added project: "${p.title}"`));
    } else {
      const deleted = oldProjects.filter((op) => !newProjects.some((np) => np.id === op.id));
      deleted.forEach((p) => logs.push(`Deleted project: "${p.title}"`));
    }
  } else {
    newProjects.forEach((np) => {
      const op = oldProjects.find((p) => p.id === np.id);
      if (op && JSON.stringify(op) !== JSON.stringify(np)) {
        logs.push(`Modified project: "${np.title}"`);
      }
    });
  }

  // 2. Compare blogs
  const oldBlogs = oldCfg.blogs || [];
  const newBlogs = newCfg.blogs || [];
  if (oldBlogs.length !== newBlogs.length) {
    if (newBlogs.length > oldBlogs.length) {
      const added = newBlogs.filter((nb) => !oldBlogs.some((ob) => ob.id === nb.id));
      added.forEach((b) => logs.push(`Published blog article: "${b.title}"`));
    } else {
      const deleted = oldBlogs.filter((ob) => !newBlogs.some((nb) => nb.id === ob.id));
      deleted.forEach((b) => logs.push(`Deleted blog article: "${b.title}"`));
    }
  } else {
    newBlogs.forEach((nb) => {
      const ob = oldBlogs.find((b) => b.id === nb.id);
      if (ob && JSON.stringify(ob) !== JSON.stringify(nb)) {
        logs.push(`Updated blog article: "${nb.title}"`);
      }
    });
  }

  // 3. Compare Our Story section
  if (JSON.stringify(oldCfg.story) !== JSON.stringify(newCfg.story)) {
    logs.push('Updated "Our Story" section details');
  }

  // 4. Compare featured press items
  const oldPress = oldCfg.press || [];
  const newPress = newCfg.press || [];
  if (oldPress.length !== newPress.length) {
    logs.push(`Updated featured press items (Total: ${newPress.length})`);
  } else if (JSON.stringify(oldPress) !== JSON.stringify(newPress)) {
    logs.push('Modified featured press details');
  }

  // 5. Compare website online/offline status
  if (oldCfg.isWebsiteOffline !== newCfg.isWebsiteOffline) {
    logs.push(`Changed website visibility: ${newCfg.isWebsiteOffline ? 'OFFLINE (Maintenance Mode)' : 'ONLINE (Live)'}`);
  }

  if (logs.length === 0) {
    logs.push('Updated website settings');
  }

  return logs;
}

export async function GET() {
  try {
    if (runtimeConfig) {
      return jsonConfig(runtimeConfig);
    }

    const config = await getConfig(defaultConfig as unknown as Record<string, unknown>);
    return jsonConfig(config);
  } catch {
    return jsonConfig(defaultConfig);
  }
}

export async function POST(request: Request) {
  // ── Rate Limit (400 config saves / 5 minutes) ────────────────────────────────
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.configUpdate);
  if (rateLimitResponse) return rateLimitResponse;

  // ── Body Size Check (4MB max for full site config with base64 images) ─────
  const requestError = validateJsonRequest(request, 4 * 1024 * 1024);
  if (requestError) {
    const status = requestError.includes('exceeds') ? 413 : 400;
    return NextResponse.json({ error: requestError }, { status });
  }

  // Check auth — both admin and superadmin can modify site configuration
  const auth = await requireRole('admin', 'superadmin');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const username = auth.username;

  try {
    const rawConfig = await request.json();

    // ── Schema Validation ─────────────────────────────────────────────────────
    const schemaResult = validateSiteConfig(rawConfig);
    if (!schemaResult.valid) {
      return NextResponse.json({ error: schemaResult.error }, { status: 400 });
    }

    // ── Deep Sanitize all string values to prevent Stored XSS ─────────────────
    const newConfig = schemaResult.value as unknown as SiteConfig;
    
    let oldConfig: SiteConfig = defaultConfig as unknown as SiteConfig;
    try {
      if (runtimeConfig) {
        oldConfig = runtimeConfig as SiteConfig;
      } else {
        oldConfig = await getConfig(defaultConfig as unknown as Record<string, unknown>) as unknown as SiteConfig;
      }
    } catch {
      oldConfig = defaultConfig as unknown as SiteConfig;
    }

    runtimeConfig = newConfig;
    
    // Diff configuration and log
    const diffs = generateDiffLogs(oldConfig, newConfig);
    for (const action of diffs) {
      await addAuditLog(action, username);
    }
    
    // Save config via dbAdapter (Upstash Redis or local files)
    try {
      await saveConfig(newConfig as unknown as Record<string, unknown>);
      try {
        revalidatePath('/');
        revalidatePath('/ad');
      } catch (err) {
        console.warn('Revalidation failed:', err);
      }
      return NextResponse.json({ success: true, persisted: true });
    } catch (fsError) {
      console.warn('Failed to save configuration via adapter:', fsError);
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
        return NextResponse.json({ 
          success: false, 
          error: 'No database is configured or database connection failed. Your changes cannot be saved on Vercel.' 
        }, { status: 500 });
      }
      return NextResponse.json({ 
        success: true, 
        persisted: false,
        warning: 'Configuration updated temporarily, but saving failed.'
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
