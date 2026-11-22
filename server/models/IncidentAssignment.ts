import mongoose, { Document, Schema, Types } from 'mongoose';

export type AssignmentStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed';

export interface IIncidentAssignment extends Document {
  incident: Types.ObjectId;
  responder: Types.ObjectId;
  assignedByAdmin: Types.ObjectId;
  status: AssignmentStatus;
  assignmentNotes?: string;
  assignedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

const IncidentAssignmentSchema = new Schema<IIncidentAssignment>(
  {
    incident: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true,
    },
    responder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedByAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined', 'Completed'],
      default: 'Pending',
      index: true,
    },
    assignmentNotes: {
      type: String,
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

export const IncidentAssignment = mongoose.model<IIncidentAssignment>(
  'IncidentAssignment',
  IncidentAssignmentSchema
);
