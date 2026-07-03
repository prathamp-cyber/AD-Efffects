import { promises as fs } from 'fs';
import path from 'path';
import { sanitizeText } from '../validation';
import { getServerEnv } from '../serverEnv';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

const localLogsPath = path.join(process.cwd(), 'src', 'data', 'auditLogs.json');

// Upstash Redis credentials config (works locally & on Vercel deployments)
const REDIS_URL = getServerEnv('UPSTASH_REDIS_REST_URL') || getServerEnv('KV_REST_API_URL');
const REDIS_TOKEN = getServerEnv('UPSTASH_REDIS_REST_TOKEN') || getServerEnv('KV_REST_API_TOKEN');

export async function addAuditLog(action: string, user: string): Promise<void> {
  const logEntry: AuditLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    action: sanitizeText(action).slice(0, 500),
    user: sanitizeText(user).slice(0, 100)
  };

  // 1. Try logging to Upstash Redis (REST pipeline)
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const cleanUrl = REDIS_URL.endsWith('/') ? REDIS_URL.slice(0, -1) : REDIS_URL;
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${REDIS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['LPUSH', 'audit_logs', JSON.stringify(logEntry)])
      });
      if (response.ok) {
        return;
      }
    } catch (err) {
      console.warn('Upstash Redis write failed, falling back to local file:', err);
    }
  }

  // 2. Fallback to local JSON logging (preserves data locally)
  try {
    const dataDir = path.dirname(localLogsPath);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}

    let logs: AuditLog[] = [];
    try {
      const data = await fs.readFile(localLogsPath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        logs = parsed;
      }
    } catch {
      // Ignored if file doesn't exist yet or is invalid JSON
    }
    logs.unshift(logEntry);
    
    // Keep last 150 log entries to maintain fast performance
    if (logs.length > 150) {
      logs = logs.slice(0, 150);
    }
    await fs.writeFile(localLogsPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to record local audit log:', err);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  // 1. Try fetching logs from Upstash Redis list
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const cleanUrl = REDIS_URL.endsWith('/') ? REDIS_URL.slice(0, -1) : REDIS_URL;
      const response = await fetch(`${cleanUrl}/LRANGE/audit_logs/0/99`, {
        headers: {
          Authorization: `Bearer ${REDIS_TOKEN}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.result)) {
          return data.result.map((item: string) => {
            try {
              return JSON.parse(item);
            } catch {
              return { id: 'err', timestamp: new Date().toISOString(), action: String(item), user: 'System' };
            }
          });
        }
      }
    } catch (err) {
      console.warn('Upstash Redis read failed, falling back to local file:', err);
    }
  }

  // 2. Fallback: read from local JSON auditLogs file
  try {
    const data = await fs.readFile(localLogsPath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
