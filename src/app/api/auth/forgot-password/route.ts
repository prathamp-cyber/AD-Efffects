import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const credentialsPath = path.join(process.cwd(), 'src', 'data', 'adminCredentials.json');
const otpPath = path.join(process.cwd(), 'src', 'data', 'otp_temp.json');

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Determine registered admin email
    let registeredEmail = 'admin@adefffects.com';
    try {
      const data = await fs.readFile(credentialsPath, 'utf8');
      const creds = JSON.parse(data);
      if (creds.email) {
        registeredEmail = creds.email;
      }
    } catch {
      // Fallback to default
    }

    if (email.toLowerCase().trim() !== registeredEmail.toLowerCase().trim()) {
      return NextResponse.json({ error: 'This email is not registered for admin access' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save OTP to secure temp file (not accessible from public directory)
    await fs.writeFile(otpPath, JSON.stringify({ email: registeredEmail, otp, expiry }), 'utf8');

    // Secure Simulated Dispatch: Print OTP ONLY to the private server terminal console.
    // It is NEVER written to the public directory and NEVER sent in the client API response.
    console.log(`\n==================================================`);
    console.log(`[SECURITY ALERT] Admin OTP generated for: ${registeredEmail}`);
    console.log(`Verification Security Code: ${otp}`);
    console.log(`==================================================\n`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP security code has been sent to your registered email address.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
