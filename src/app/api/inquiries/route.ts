import { NextResponse } from 'next/server';
import { requireRole } from '../auth/session';
import { addAuditLog } from '../logs/db';
import { isObject, sanitizeText, validateEmail, validateId, validateJsonRequest, validateString } from '../validation';
import { checkRateLimit, RATE_LIMITS } from '../auth/rateLimiter';
import { getInquiries, saveInquiries } from '../dbAdapter';
import nodemailer from 'nodemailer';

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

async function sendInquiryEmail(inq: Inquiry) {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  const receiver = process.env.CONTACT_RECEIVER_EMAIL || 'theadeffectt@gmail.com';

  if (!host || !portStr || !user || !pass) {
    console.warn('[MAIL] SMTP configuration is incomplete. Skipping email notification.');
    return;
  }

  const port = parseInt(portStr, 10);

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const mailOptions = {
      from: `"${inq.name}" <${user}>`,
      to: receiver,
      replyTo: inq.email,
      subject: `New Contact Form Inquiry: ${inq.projectType}`,
      text: `You have received a new inquiry from your website contact form.

Name: ${inq.name}
Email: ${inq.email}
Project Type: ${inq.projectType}
Message:
${inq.message}

Date: ${inq.date}`,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #c5a880; border-bottom: 1px solid #eee; padding-bottom: 10px; font-weight: normal; text-transform: uppercase; letter-spacing: 0.1em;">New Website Inquiry</h2>
        <p style="margin: 15px 0;"><strong>Name:</strong> ${inq.name}</p>
        <p style="margin: 15px 0;"><strong>Email:</strong> <a href="mailto:${inq.email}">${inq.email}</a></p>
        <p style="margin: 15px 0;"><strong>Project Type:</strong> ${inq.projectType}</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 3px solid #c5a880; white-space: pre-wrap; font-style: italic;">
          ${inq.message}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #888;">Submitted on ${new Date(inq.date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>`
    };

    await transporter.sendMail(mailOptions);
    console.log('[MAIL] Inquiry email sent successfully to:', receiver);
  } catch (err) {
    console.error('[MAIL] Failed to send inquiry email:', err);
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
      
      // Send email notification (failsafe, won't cause inquiry submission to fail if it errors)
      await sendInquiryEmail(newInquiry);
      
      return NextResponse.json({ success: true });
    } catch (fsError) {
      console.warn('Failed to save inquiry via adapter:', fsError);
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
        return NextResponse.json({ success: false, error: 'Database is not connected. Submission failed.' }, { status: 500 });
      }
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
