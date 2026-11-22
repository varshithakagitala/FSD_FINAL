import mongoose, { Document, Schema, Types } from 'mongoose';

export type IncidentCategory =
  | 'Medical'
  | 'Fire'
  | 'Security'
  | 'Accident'
  | 'Electrical'
  | 'Infrastructure'
  | 'Other';

export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus =
  | 'Reported'
  | 'Assigned'
  | 'Accepted'
  | 'En Route'
  | 'On Scene'
  | 'Resolved'
  | 'Unable to Respond'
  | 'Cancelled';

export interface IIncident extends Document {
  incidentCode: string;
  reporter: Types.ObjectId;
  reporterName: string;
  reporterEmail: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  calculatedPriority: IncidentPriority;
  status: IncidentStatus;
  campusLocation: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  photoUrl?: string;
  assignedResponder?: Types.ObjectId;
  assignedResponderName?: string;
  assignedResponderBadge?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterEmail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Medical', 'Fire', 'Security', 'Accident', 'Electrical', 'Infrastructure', 'Other'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    calculatedPriority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Reported', 'Assigned', 'Accepted', 'En Route', 'On Scene', 'Resolved', 'Unable to Respond', 'Cancelled'],
      default: 'Reported',
      index: true,
    },
    campusLocation: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    assignedResponder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedResponderName: {
      type: String,
    },
    assignedResponderBadge: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

IncidentSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
