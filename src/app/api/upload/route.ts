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

  // ── Rate Limit (20 uploads / 5 minutes) ───────────────────────────────────
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

  // Admin only — only the admin panel uploads files
  const auth = await requireRole('admin');
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

    // Convert file to buffer first so we can validate magic bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Strict File Validation ──────────────────────────────────────────────
    // Validates: file size (10MB), extension whitelist (no SVG — XSS vector),
    //            MIME type, magic bytes signature, and embedded script detection
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

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {
      // Ignored if it already exists or if it fails on read-only systems
    }

    // Generate unique filename — sanitize to prevent path traversal
    const { safeBaseName, extension } = validation.value;
    const timestamp = Date.now();
    const fileName = `${safeBaseName}_${timestamp}.${extension}`;

    // Final safety check — ensure fileName doesn't escape uploads dir
    const filePath = path.join(uploadsDir, fileName);
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    if (resolvedPath !== path.join(resolvedUploadsDir, fileName)) {
      logSecurityEvent({
        type: 'SUSPICIOUS_PATTERN',
        ip,
        userAgent,
        endpoint: '/api/upload',
        method: 'POST',
        detail: `Path traversal attempt detected during upload (resolved path: ${resolvedPath})`
      });
      return NextResponse.json({ error: 'Invalid file path detected' }, { status: 400 });
    }

    // Save file
    try {
      await fs.writeFile(filePath, buffer);
      const fileUrl = `/uploads/${fileName}`;
      return NextResponse.json({ success: true, url: fileUrl });
    } catch (fsError) {
      console.warn('Failed to save file (likely on Vercel):', fsError);
      return NextResponse.json(
        { 
          error: 'File system is read-only. In this test/Vercel deployment, please enter an external image URL directly (e.g. from postimg.cc, imgur, or unsplash) instead of uploading a file.' 
        }, 
        { status: 403 }
      );
    }
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
