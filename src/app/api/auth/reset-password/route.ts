import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const credentialsPath = path.join(process.cwd(), 'src', 'data', 'adminCredentials.json');
const otpPath = path.join(process.cwd(), 'src', 'data', 'otp_temp.json');

export async function POST(request: Request) {
  try {
    const { email, resetToken, newUsername, newPassword } = await request.json();

    if (!email || !resetToken || !newUsername || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    let savedOtpData;
    try {
      const data = await fs.readFile(otpPath, 'utf8');
      savedOtpData = JSON.parse(data);
    } catch {
      return NextResponse.json({ error: 'Reset request expired or not found' }, { status: 400 });
    }

    if (
      savedOtpData.email.toLowerCase().trim() !== email.toLowerCase().trim() ||
      savedOtpData.resetToken !== resetToken ||
      !savedOtpData.verified ||
      Date.now() > savedOtpData.resetTokenExpiry
    ) {
      return NextResponse.json({ error: 'Invalid or expired password reset session' }, { status: 400 });
    }

    // Security check: validate inputs
    if (newUsername.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long' }, { status: 400 });
    }
    if (newPassword.trim().length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Save new credentials
    const credentials = {
      username: newUsername.trim(),
      password: newPassword.trim(),
      email: email.toLowerCase().trim()
    };

    // Ensure data directory exists
    const dataDir = path.dirname(credentialsPath);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}

    await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2), 'utf8');

    // Clean up temporary OTP session file
    try {
      await fs.unlink(otpPath);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset admin credentials' }, { status: 500 });
  }
}
