import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionCookie, verifySessionToken } from '../auth/session';

export async function POST(request: Request) {
  // Check auth
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {
      // Ignored if it already exists or if it fails on read-only systems
    }

    // Generate unique filename to prevent overwrites
    const originalName = file.name || 'image.jpg';
    const extension = path.extname(originalName) || '.jpg';
    const baseName = path.basename(originalName, extension)
      .replace(/[^a-zA-Z0-9]/g, '_') // sanitize filename
      .toLowerCase();
    const timestamp = Date.now();
    const fileName = `${baseName}_${timestamp}${extension}`;
    const filePath = path.join(uploadsDir, fileName);

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
    console.error('File upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Upload failed: ' + message }, { status: 500 });
  }
}
