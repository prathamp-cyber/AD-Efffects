import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireRole } from '../auth/session';
import { validateFileUpload, sanitizeHtml, validateMultipartRequest } from '../validation';
import { checkRateLimit, RATE_LIMITS } from '../auth/rateLimiter';
import { logSecurityEvent, extractIP } from '../securityLogger';

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

    // ── Strategy 1: Local filesystem (works locally and non-Vercel) ──────────
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, fileName);
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadsDir = path.resolve(uploadsDir);
      if (!resolvedPath.startsWith(resolvedUploadsDir)) {
        return NextResponse.json({ error: 'Invalid file path detected' }, { status: 400 });
      }
      await fs.writeFile(filePath, buffer);
      return NextResponse.json({ success: true, url: `/uploads/${fileName}`, storage: 'local' });
    } catch {
      // Filesystem is read-only (Vercel) — fall through
    }

    // ── Strategy 2: Vercel Blob (free, works on Vercel Hobby plan) ───────────
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`uploads/${fileName}`, buffer, {
          access: 'public',
          token: blobToken,
          contentType: file.type || 'image/jpeg',
        });
        return NextResponse.json({ success: true, url: blob.url, storage: 'vercel-blob' });
      } catch (blobErr) {
        console.warn('[UPLOAD] Vercel Blob upload failed:', blobErr);
      }
    }

    // ── Strategy 3: Firebase Storage via REST API ────────────────────────────
    const FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (FIREBASE_STORAGE_BUCKET && FIREBASE_API_KEY) {
      try {
        const encodedName = encodeURIComponent(`uploads/${fileName}`);
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o?uploadType=media&name=${encodedName}&key=${FIREBASE_API_KEY}`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: new Uint8Array(buffer),
        });
        if (res.ok) {
          const data = await res.json() as { name?: string; downloadTokens?: string };
          if (data.downloadTokens) {
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedName}?alt=media&token=${data.downloadTokens}`;
            return NextResponse.json({ success: true, url: publicUrl, storage: 'firebase' });
          }
        }
      } catch (fbErr) {
        console.warn('[UPLOAD] Firebase Storage upload failed:', fbErr);
      }
    }

    // ── All strategies failed ────────────────────────────────────────────────
    return NextResponse.json(
      { error: 'Image upload is not configured. Please add BLOB_READ_WRITE_TOKEN to Vercel environment variables.' },
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
