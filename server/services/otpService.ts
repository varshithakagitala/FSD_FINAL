import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { EmailOtp, OtpPurpose } from '../models/EmailOtp';

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export interface GeneratedOtp {
  otpCode: string;
  expiresAt: Date;
}

export class OtpService {
  /**
   * Generates a secure 6-digit numeric OTP, enforces cooldown, hashes with bcrypt,
   * invalidates prior codes, and saves to MongoDB.
   */
  public async generateAndSaveOtp(email: string, purpose: OtpPurpose): Promise<GeneratedOtp> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Enforce 60-second cooldown from most recent OTP
    const recentOtp = await EmailOtp.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });
    if (recentOtp) {
      const elapsedSeconds = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        throw new Error(`Please wait ${remaining} seconds before requesting a new verification code.`);
      }
    }

    // 2. Invalidate all existing pending OTPs for this email and purpose
    await EmailOtp.deleteMany({ email: normalizedEmail, purpose });

    // 3. Generate cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // 4. Hash the OTP using bcrypt before storing in MongoDB
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 5. Store in MongoDB Atlas
    await EmailOtp.create({
      email: normalizedEmail,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
    });

    return { otpCode, expiresAt };
  }

  /**
   * Validates an entered OTP code against the hashed record in MongoDB.
   * Throttles invalid attempts, checks expiration, and deletes OTP on success.
   */
  public async verifyOtp(
    email: string,
    purpose: OtpPurpose,
    enteredCode: string
  ): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!enteredCode || !/^\d{6}$/.test(enteredCode.trim())) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    const otpDoc = await EmailOtp.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return { success: false, error: 'No active verification code found for this account. Please request a new OTP.' };
    }

    // Check if expired
    if (new Date() > otpDoc.expiresAt) {
      await EmailOtp.findByIdAndDelete(otpDoc._id);
      return { success: false, error: 'Verification code has expired (valid for 5 minutes). Please request a new code.' };
    }

    // Check if attempts exceeded
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await EmailOtp.findByIdAndDelete(otpDoc._id);
      return { success: false, error: 'Maximum verification attempts exceeded (5/5). Code invalidated. Request a new OTP.' };
    }

    // Compare code with bcrypt hash
    const isMatch = await bcrypt.compare(enteredCode.trim(), otpDoc.otpHash);

    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = Math.max(0, otpDoc.maxAttempts - otpDoc.attempts);
      return {
        success: false,
        error: `Incorrect verification code. Attempts remaining: ${remaining}/5`,
        remainingAttempts: remaining,
      };
    }

    // Match successful! Invalidate OTP to prevent replay attacks
    await EmailOtp.findByIdAndDelete(otpDoc._id);
    return { success: true };
  }
}

export const otpService = new OtpService();
