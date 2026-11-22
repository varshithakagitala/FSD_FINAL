import mongoose, { Document, Schema, Types } from 'mongoose';

export type ResponderSpecialization = 'Medical' | 'Fire' | 'Security' | 'Electrical' | 'General';
export type ResponderDutyStatus = 'Available' | 'Dispatched' | 'Busy' | 'Off Duty';

export interface IResponderProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  badgeNumber: string;
  specialization: ResponderSpecialization;
  currentStatus: ResponderDutyStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  campusBaseZone: string;
  activeIncidentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResponderProfileSchema = new Schema<IResponderProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    badgeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    specialization: {
      type: String,
      enum: ['Medical', 'Fire', 'Security', 'Electrical', 'General'],
      default: 'General',
      index: true,
    },
    currentStatus: {
      type: String,
      enum: ['Available', 'Dispatched', 'Busy', 'Off Duty'],
      default: 'Available',
      index: true,
    },
    currentLatitude: {
      type: Number,
    },
    currentLongitude: {
      type: Number,
    },
    campusBaseZone: {
      type: String,
      default: 'Main Security HQ',
      trim: true,
    },
    activeIncidentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ResponderProfile = mongoose.model<IResponderProfile>(
  'ResponderProfile',
  ResponderProfileSchema
);
