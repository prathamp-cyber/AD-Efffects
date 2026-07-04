import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireRole } from '../auth/session';
import { validateFileUpload, sanitizeHtml, validateMultipartRequest } from '../validation';
import { checkRateLimit, RATE_LIMITS } from '../auth/rateLimiter';
import { logSecurityEvent, extractIP } from '../securityLogger';

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/**
 * Upload a file buffer to Firebase Storage via REST API.
 * Returns the public download URL on success, or null on failure.
 */
async function uploadToFirebaseStorage(buffer: Buffer, fileName: string, mimeType: string): Promise<string | null> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY || !FIREBASE_STORAGE_BUCKET) return null;

  const encodedName = encodeURIComponent(`uploads/${fileName}`);
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o?uploadType=media&name=${encodedName}&key=${FIREBASE_API_KEY}`;

  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buffer.length),
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[UPLOAD] Firebase Storage upload failed:', res.status, text);
      return null;
    }

    const data = await res.json() as { name?: string; downloadTokens?: string };
    if (data.name && data.downloadTokens) {
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedName}?alt=media&token=${data.downloadTokens}`;
      return publicUrl;
    }
    return null;
  } catch (err) {
    console.warn('[UPLOAD] Firebase Storage upload error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  const ip = extractIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  // ── Rate Limit ───────────────────────────────────────────────────────────
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.upload);
  if (rateLimitResponse) {
    logSecurityEvent({
      type: 'RATE_LIMIT_HIT',
      ip,
      userAgent,
      endpoint: '/api/upload',
      method: 'POST',
      detail: 'File upload rate limit exceeded'
    });
    return rateLimitResponse;
  }

  // Admin only
  const auth = await requireRole('admin', 'superadmin');
  if (!auth.authorized) {
    logSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS',
      ip,
      userAgent,
      endpoint: '/api/upload',
      method: 'POST',
      detail: 'Unauthorized attempt to upload files (requires admin)'
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestError = validateMultipartRequest(request, 10 * 1024 * 1024 + 1024 * 1024);
  if (requestError) {
    const status = requestError.includes('exceeds') ? 413 : 400;
    return NextResponse.json({ error: requestError }, { status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Strict File Validation ───────────────────────────────────────────────
    const validation = validateFileUpload(file, buffer, { maxSizeBytes: 10 * 1024 * 1024 });
    if (validation.error) {
      logSecurityEvent({
        type: 'UPLOAD_BLOCKED',
        ip,
        userAgent,
        endpoint: '/api/upload',
        method: 'POST',
        detail: `Upload validation failed: ${validation.error} (filename: ${sanitizeHtml(file.name || 'unknown')})`
      });
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { safeBaseName, extension } = validation.value;
    const timestamp = Date.now();
    const fileName = `${safeBaseName}_${timestamp}.${extension}`;
    const mimeType = file.type || 'image/jpeg';

    // 1. Try local filesystem (works locally and on non-read-only servers)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, fileName);
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadsDir = path.resolve(uploadsDir);

      // Path traversal check
      if (!resolvedPath.startsWith(resolvedUploadsDir + path.sep) && resolvedPath !== path.join(resolvedUploadsDir, fileName)) {
        return NextResponse.json({ error: 'Invalid file path detected' }, { status: 400 });
      }

      await fs.writeFile(filePath, buffer);
      const fileUrl = `/uploads/${fileName}`;
      return NextResponse.json({ success: true, url: fileUrl, storage: 'local' });
    } catch {
      // Filesystem is read-only (Vercel), fall through to Firebase Storage
    }

    // 2. Try Firebase Storage (primary cloud fallback)
    const firebaseUrl = await uploadToFirebaseStorage(buffer, fileName, mimeType);
    if (firebaseUrl) {
      return NextResponse.json({ success: true, url: firebaseUrl, storage: 'firebase' });
    }

    // 3. No storage available — return error
    return NextResponse.json(
      { error: 'Could not save the uploaded file. Please check Firebase Storage configuration or try an external image URL (e.g. from postimg.cc).' },
      { status: 503 }
    );

  } catch (error) {
    const message = error instanceof Error ? sanitizeHtml(error.message) : 'Unknown error';
    logSecurityEvent({
      type: 'API_ERROR',
      ip,
      userAgent,
      endpoint: '/api/upload',
      method: 'POST',
      detail: `File upload exception: ${message}`
    });
    return NextResponse.json({ error: 'Upload failed: ' + message }, { status: 500 });
  }
}
