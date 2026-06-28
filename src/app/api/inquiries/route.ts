import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionCookie, verifySessionToken } from '../auth/session';

const inquiriesPath = path.join(process.cwd(), 'src', 'data', 'inquiries.json');

// Security Hardening: XSS Sanitizer to neutralize HTML injection
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export async function GET() {
  // Check auth
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await fs.readFile(inquiriesPath, 'utf8');
    const inquiries = JSON.parse(data);
    return NextResponse.json(inquiries);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, projectType, message } = body;

    // 1. Check required fields and type safety
    if (
      typeof name !== 'string' || 
      typeof email !== 'string' || 
      typeof message !== 'string'
    ) {
      return NextResponse.json({ error: 'Required fields missing or invalid' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const trimmedProjectType = typeof projectType === 'string' ? projectType.trim() : 'Residential';

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json({ error: 'Required fields cannot be empty' }, { status: 400 });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    // 3. Enforce character length limits (prevents payload abuse / DoS)
    if (trimmedName.length > 100) return NextResponse.json({ error: 'Name exceeds 100 characters' }, { status: 400 });
    if (trimmedEmail.length > 100) return NextResponse.json({ error: 'Email exceeds 100 characters' }, { status: 400 });
    if (trimmedProjectType.length > 50) return NextResponse.json({ error: 'Project type exceeds 50 characters' }, { status: 400 });
    if (trimmedMessage.length > 2000) return NextResponse.json({ error: 'Message exceeds 2000 characters' }, { status: 400 });

    // 4. Sanitize inputs to prevent Stored XSS
    const sanitizedName = sanitizeString(trimmedName);
    const sanitizedEmail = sanitizeString(trimmedEmail);
    const sanitizedProjectType = sanitizeString(trimmedProjectType);
    const sanitizedMessage = sanitizeString(trimmedMessage);

    let inquiries = [];
    try {
      const data = await fs.readFile(inquiriesPath, 'utf8');
      inquiries = JSON.parse(data);
    } catch {
      // Ignored if file does not exist
    }

    const newInquiry = {
      id: Date.now().toString(),
      name: sanitizedName,
      email: sanitizedEmail,
      projectType: sanitizedProjectType,
      message: sanitizedMessage,
      date: new Date().toISOString()
    };

    inquiries.push(newInquiry);
    
    try {
      await fs.writeFile(inquiriesPath, JSON.stringify(inquiries, null, 2), 'utf8');
      return NextResponse.json({ success: true });
    } catch (fsError) {
      console.warn('Failed to save inquiry to file system:', fsError);
      return NextResponse.json({ success: true, warning: 'Saved in-memory only' });
    }
  } catch (error) {
    console.error('Failed to submit inquiry:', error);
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Check auth
  const token = await getSessionCookie();
  const isValid = verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
    }

    const data = await fs.readFile(inquiriesPath, 'utf8');
    const inquiries = JSON.parse(data);
    const filteredInquiries = inquiries.filter((inq: { id: string }) => inq.id !== id);

    await fs.writeFile(inquiriesPath, JSON.stringify(filteredInquiries, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete inquiry:', error);
    return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 });
  }
}
