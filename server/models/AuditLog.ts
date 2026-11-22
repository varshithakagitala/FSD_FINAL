import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  userName?: string;
  actionType: string;
  entityName: string;
  entityId?: string;
  ipAddress?: string;
  detailsJson?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    detailsJson: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
