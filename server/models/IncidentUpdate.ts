import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIncidentUpdate extends Document {
  incident: Types.ObjectId;
  updatedByUser: Types.ObjectId;
  updaterName: string;
  updaterRole: string;
  statusBefore: string;
  statusAfter: string;
  noteText: string;
  photoUrl?: string;
  createdAt: Date;
}

const IncidentUpdateSchema = new Schema<IIncidentUpdate>(
  {
    incident: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true,
    },
    updatedByUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updaterName: {
      type: String,
      required: true,
    },
    updaterRole: {
      type: String,
      required: true,
    },
    statusBefore: {
      type: String,
      required: true,
    },
    statusAfter: {
      type: String,
      required: true,
    },
    noteText: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

IncidentUpdateSchema.index({ incident: 1, createdAt: 1 });

export const IncidentUpdate = mongoose.model<IIncidentUpdate>(
  'IncidentUpdate',
  IncidentUpdateSchema
);
