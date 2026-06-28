import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const otpPath = path.join(process.cwd(), 'src', 'data', 'otp_temp.json');

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    let savedOtpData;
    try {
      const data = await fs.readFile(otpPath, 'utf8');
      savedOtpData = JSON.parse(data);
    } catch {
      return NextResponse.json({ error: 'No active OTP request found' }, { status: 400 });
    }

    if (savedOtpData.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Invalid request details' }, { status: 400 });
    }

    if (Date.now() > savedOtpData.expiry) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (savedOtpData.otp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid security code (OTP)' }, { status: 400 });
    }

    // Generate a single-use secure reset token valid for 10 minutes
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 10 * 60 * 1000;

    // Update temp file to include reset token
    await fs.writeFile(otpPath, JSON.stringify({ 
      ...savedOtpData, 
      resetToken, 
      resetTokenExpiry,
      verified: true 
    }), 'utf8');

    return NextResponse.json({ success: true, resetToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
