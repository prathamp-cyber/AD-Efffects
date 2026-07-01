/**
 * Database Adapter
 * 
 * Provides a unified data access layer that reads/writes from:
 *   1. Upstash Redis (if configured via process.env.UPSTASH_REDIS_REST_URL)
 *   2. Local JSON files (fallback for local development)
 * 
 * This prevents EROFS (Read-only file system) 500 errors when deployed
 * to serverless hosting environments like Vercel.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { getServerEnv } from './serverEnv';

const REDIS_URL = getServerEnv('UPSTASH_REDIS_REST_URL') || getServerEnv('KV_REST_API_URL');
const REDIS_TOKEN = getServerEnv('UPSTASH_REDIS_REST_TOKEN') || getServerEnv('KV_REST_API_TOKEN');

// Local file paths
const configPath = path.join(process.cwd(), 'src', 'data', 'siteConfig.json');
const inquiriesPath = path.join(process.cwd(), 'src', 'data', 'inquiries.json');

/**
 * Run a command on Upstash Redis REST API
 */
export async function runRedisCommand(command: string[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const cleanUrl = REDIS_URL.endsWith('/') ? REDIS_URL.slice(0, -1) : REDIS_URL;
  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (response.ok) {
    const data = (await response.json()) as { result: unknown };
    return data.result;
  }
  throw new Error(`Upstash Redis error: ${response.statusText}`);
}

/**
 * GET Site Configuration
 */
export async function getConfig(fallbackData: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const data = await runRedisCommand(['GET', 'site_config']);
      if (typeof data === 'string') return JSON.parse(data) as Record<string, unknown>;
    } catch (err) {
      console.warn('[DB] Redis read config failed, falling back to file:', err);
    }
  }
  try {
    const fileData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(fileData) as Record<string, unknown>;
  } catch {
    return fallbackData;
  }
}

/**
 * SAVE Site Configuration
 */
export async function saveConfig(data: Record<string, unknown>): Promise<void> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      await runRedisCommand(['SET', 'site_config', JSON.stringify(data)]);
      return;
    } catch (err) {
      console.warn('[DB] Redis save config failed, falling back to file:', err);
    }
  }
  const dataDir = path.dirname(configPath);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
  await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * GET Inquiries
 */
export async function getInquiries(): Promise<Record<string, unknown>[]> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const data = await runRedisCommand(['GET', 'site_inquiries']);
      if (typeof data === 'string') return JSON.parse(data) as Record<string, unknown>[];
    } catch (err) {
      console.warn('[DB] Redis read inquiries failed, falling back to file:', err);
    }
  }
  try {
    const fileData = await fs.readFile(inquiriesPath, 'utf8');
    return JSON.parse(fileData) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

/**
 * SAVE Inquiries
 */
export async function saveInquiries(data: Record<string, unknown>[]): Promise<void> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      await runRedisCommand(['SET', 'site_inquiries', JSON.stringify(data)]);
      return;
    } catch (err) {
      console.warn('[DB] Redis save inquiries failed, falling back to file:', err);
    }
  }
  const dataDir = path.dirname(inquiriesPath);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
  await fs.writeFile(inquiriesPath, JSON.stringify(data, null, 2), 'utf8');
}
