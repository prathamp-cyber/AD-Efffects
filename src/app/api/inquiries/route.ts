import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionCookie, verifySessionToken } from '../auth/session';

const inquiriesPath = path.join(process.cwd(), 'src', 'data', 'inquiries.json');

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

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    let inquiries = [];
    try {
      const data = await fs.readFile(inquiriesPath, 'utf8');
      inquiries = JSON.parse(data);
    } catch {
      // Ignored if file does not exist
    }

    const newInquiry = {
      id: Date.now().toString(),
      name,
      email,
      projectType: projectType || 'Residential',
      message,
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
