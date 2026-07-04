/**
 * Database Adapter
 * 
 * Provides a unified data access layer that reads/writes from:
 *   1. Upstash Redis (if configured via process.env.UPSTASH_REDIS_REST_URL)
 *   2. Firebase Firestore (if Firebase env vars are present — the primary production store)
 *   3. Local JSON files (fallback for local development only)
 * 
 * This prevents EROFS (Read-only file system) 500 errors when deployed
 * to serverless hosting environments like Vercel.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { getServerEnv } from './serverEnv';

const REDIS_URL = getServerEnv('UPSTASH_REDIS_REST_URL') || getServerEnv('KV_REST_API_URL');
const REDIS_TOKEN = getServerEnv('UPSTASH_REDIS_REST_TOKEN') || getServerEnv('KV_REST_API_TOKEN');

// Firebase env vars (server-side access via NEXT_PUBLIC_ prefix which is exposed to both)
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Local file paths (used in local dev only)
const configPath = path.join(process.cwd(), 'src', 'data', 'siteConfig.json');
const inquiriesPath = path.join(process.cwd(), 'src', 'data', 'inquiries.json');

// ────────────────────────────────────────────────────────────────────────────
// Firestore REST API helpers (server-side, no Firebase SDK needed)
// ────────────────────────────────────────────────────────────────────────────

function hasFirestore(): boolean {
  return !!(FIREBASE_PROJECT_ID && FIREBASE_API_KEY);
}

/**
 * Convert a plain JS object to Firestore REST API document fields format
 */
function toFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * Convert Firestore REST API document fields back to plain JS
 */
function fromFirestoreValue(val: Record<string, unknown>): unknown {
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue as string, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('arrayValue' in val) {
    const arr = val.arrayValue as { values?: unknown[] };
    return (arr.values || []).map((v) => fromFirestoreValue(v as Record<string, unknown>));
  }
  if ('mapValue' in val) {
    const map = val.mapValue as { fields?: Record<string, unknown> };
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(map.fields || {})) {
      obj[k] = fromFirestoreValue(v as Record<string, unknown>);
    }
    return obj;
  }
  return null;
}

function firestoreDocToObj(doc: Record<string, unknown>): Record<string, unknown> {
  const fields = (doc.fields || {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = fromFirestoreValue(v as Record<string, unknown>);
  }
  return result;
}

async function firestoreGet(collection: string, docId: string): Promise<Record<string, unknown> | null> {
  if (!hasFirestore()) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      console.warn('[DB] Firestore GET failed:', res.status, text);
      return null;
    }
    const doc = await res.json();
    return firestoreDocToObj(doc);
  } catch (err) {
    console.warn('[DB] Firestore GET error:', err);
    return null;
  }
}

async function firestoreSet(collection: string, docId: string, data: Record<string, unknown>): Promise<boolean> {
  if (!hasFirestore()) return false;
  
  // Build fields object for the entire data wrapped as a single "data" field
  // We store the entire config as a JSON string to avoid Firestore field size limits
  const jsonString = JSON.stringify(data);
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  try {
    const body = {
      fields: {
        json: { stringValue: jsonString },
        updatedAt: { integerValue: String(Date.now()) }
      }
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[DB] Firestore SET failed:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[DB] Firestore SET error:', err);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Redis helpers
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Config CRUD
// ────────────────────────────────────────────────────────────────────────────

/**
 * GET Site Configuration
 * Priority: Redis → Firestore → local file → fallback
 */
export async function getConfig(fallbackData: Record<string, unknown>): Promise<Record<string, unknown>> {
  // 1. Try Redis
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const data = await runRedisCommand(['GET', 'site_config']);
      if (typeof data === 'string') return JSON.parse(data) as Record<string, unknown>;
    } catch (err) {
      console.warn('[DB] Redis read config failed:', err);
    }
  }

  // 2. Try Firestore
  if (hasFirestore()) {
    try {
      const doc = await firestoreGet('site_data', 'config');
      if (doc && typeof doc.json === 'string') {
        return JSON.parse(doc.json) as Record<string, unknown>;
      }
    } catch (err) {
      console.warn('[DB] Firestore read config failed:', err);
    }
  }

  // 3. Try local file (local dev)
  try {
    const fileData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(fileData) as Record<string, unknown>;
  } catch {
    return fallbackData;
  }
}

/**
 * SAVE Site Configuration
 * Priority: Redis → Firestore → local file
 */
export async function saveConfig(data: Record<string, unknown>): Promise<void> {
  // 1. Try Redis
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      await runRedisCommand(['SET', 'site_config', JSON.stringify(data)]);
      return;
    } catch (err) {
      console.warn('[DB] Redis save config failed, trying Firestore:', err);
    }
  }

  // 2. Try Firestore
  if (hasFirestore()) {
    const ok = await firestoreSet('site_data', 'config', data);
    if (ok) return;
    console.warn('[DB] Firestore save config failed, trying local file.');
  }

  // 3. Fallback: local file (local dev / non-Vercel environments)
  const dataDir = path.dirname(configPath);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
  await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8');
}

// ────────────────────────────────────────────────────────────────────────────
// Inquiries CRUD
// ────────────────────────────────────────────────────────────────────────────

/**
 * GET Inquiries
 */
export async function getInquiries(): Promise<Record<string, unknown>[]> {
  // 1. Try Redis
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const data = await runRedisCommand(['GET', 'site_inquiries']);
      if (typeof data === 'string') return JSON.parse(data) as Record<string, unknown>[];
    } catch (err) {
      console.warn('[DB] Redis read inquiries failed:', err);
    }
  }

  // 2. Try Firestore
  if (hasFirestore()) {
    try {
      const doc = await firestoreGet('site_data', 'inquiries');
      if (doc && typeof doc.json === 'string') {
        return JSON.parse(doc.json) as Record<string, unknown>[];
      }
    } catch (err) {
      console.warn('[DB] Firestore read inquiries failed:', err);
    }
  }

  // 3. Local file
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
  // 1. Try Redis
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      await runRedisCommand(['SET', 'site_inquiries', JSON.stringify(data)]);
      return;
    } catch (err) {
      console.warn('[DB] Redis save inquiries failed, trying Firestore:', err);
    }
  }

  // 2. Try Firestore
  if (hasFirestore()) {
    const ok = await firestoreSet('site_data', 'inquiries', { list: data });
    if (ok) return;
  }

  // 3. Local file
  const dataDir = path.dirname(inquiriesPath);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
  await fs.writeFile(inquiriesPath, JSON.stringify(data, null, 2), 'utf8');
}
