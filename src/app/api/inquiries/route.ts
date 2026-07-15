import { NextResponse } from 'next/server';
import { requireRole } from '../auth/session';
import { addAuditLog } from '../logs/db';
import { isObject, sanitizeText, validateEmail, validateId, validateJsonRequest, validateString } from '../validation';
import { checkRateLimit, RATE_LIMITS } from '../auth/rateLimiter';
import { getInquiries, saveInquiries } from '../dbAdapter';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  date: string;
}

export async function GET() {
  // Admin only — super admin uses /api/logs for their data
  const auth = await requireRole('admin');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inquiries = await getInquiries() as unknown as Inquiry[];
    return NextResponse.json(inquiries);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  // ── Rate Limit (400 submissions / 10 minutes — public endpoint) ─────────────
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.inquiry);
  if (rateLimitResponse) return rateLimitResponse;

  // ── Body Size Check (4KB max to prevent DoS via payload bloating) ────────
  const requestError = validateJsonRequest(request, 4096);
  if (requestError) {
    const status = requestError.includes('exceeds') ? 413 : 400;
    return NextResponse.json({ error: requestError }, { status });
  }

  try {
    const body = await request.json();
    if (!isObject(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const allowedKeys = new Set(['name', 'email', 'projectType', 'message']);
    const unknownKey = Object.keys(body).find((key) => !allowedKeys.has(key));
    if (unknownKey) {
      return NextResponse.json({ error: `Unexpected field: ${unknownKey}` }, { status: 400 });
    }

    // ── Input Validation ─────────────────────────────────────────────────────
    const nameVal = validateString(body.name, 'Name', { minLen: 2, maxLen: 100 });
    if (nameVal.error) return NextResponse.json({ error: nameVal.error }, { status: 400 });

    const emailVal = validateEmail(body.email, 'Email');
    if (emailVal.error) return NextResponse.json({ error: emailVal.error }, { status: 400 });

    const projectTypeVal = validateString(body.projectType, 'Project Type', { minLen: 1, maxLen: 100 });
    // Default fallback if no project type is supplied
    const trimmedProjectType = projectTypeVal.value ? projectTypeVal.value.trim() : 'General Inquiry';

    const messageVal = validateString(body.message, 'Message', { minLen: 5, maxLen: 2000 });
    if (messageVal.error) return NextResponse.json({ error: messageVal.error }, { status: 400 });

    // ── XSS Sanitization (Strict HTML entities encoding) ───────────────────
    const sanitizedName = sanitizeText(nameVal.value);
    const sanitizedEmail = sanitizeText(emailVal.value);
    const sanitizedProjectType = sanitizeText(trimmedProjectType);
    const sanitizedMessage = sanitizeText(messageVal.value);

    let inquiries: Inquiry[] = [];
    try {
      inquiries = await getInquiries() as unknown as Inquiry[];
    } catch {
      // Ignored if key does not exist
    }

    const newInquiry: Inquiry = {
      id: Date.now().toString(),
      name: sanitizedName,
      email: sanitizedEmail,
      projectType: sanitizedProjectType,
      message: sanitizedMessage,
      date: new Date().toISOString()
    };

    inquiries.push(newInquiry);
    
    try {
      await saveInquiries(inquiries as unknown as Record<string, unknown>[]);
      return NextResponse.json({ success: true });
    } catch (fsError) {
      console.warn('Failed to save inquiry via adapter:', fsError);
      return NextResponse.json({ success: true, warning: 'Saved in-memory only' });
    }
  } catch (error) {
    console.error('Failed to submit inquiry:', error);
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Admin only — super admin cannot delete client inquiries
  const auth = await requireRole('admin');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const username = auth.username;

  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');

    // ── Strict ID Validation (alphanumeric + hyphens only) ────────────────
    const idVal = validateId(rawId, 'id');
    if (idVal.error) return NextResponse.json({ error: idVal.error }, { status: 400 });
    const id = idVal.value;

    const inquiries = await getInquiries() as unknown as Inquiry[];
    const targetInquiry = inquiries.find((inq) => inq.id === id);
    const clientName = targetInquiry ? targetInquiry.name : 'Unknown';
    const filteredInquiries = inquiries.filter((inq) => inq.id !== id);

    await saveInquiries(filteredInquiries as unknown as Record<string, unknown>[]);
    
    // Log deletion
    await addAuditLog(`Cleared client inquiry from: "${clientName}"`, username);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete inquiry:', error);
    return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 });
  }
}
