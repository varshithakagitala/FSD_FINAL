import mongoose, { Document, Schema } from 'mongoose';

export type OtpPurpose = 'signup' | 'login';

export interface IEmailOtp extends Document {
  email: string;
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

const EmailOtpSchema = new Schema<IEmailOtp>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['signup', 'login'],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL cleanup after expiration
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for querying active OTPs efficiently
EmailOtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export const EmailOtp = mongoose.model<IEmailOtp>('EmailOtp', EmailOtpSchema);
