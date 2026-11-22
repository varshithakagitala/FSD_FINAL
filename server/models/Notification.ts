import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationChannel = 'EMAIL' | 'IN_APP' | 'BOTH';

export interface INotification extends Document {
  user: Types.ObjectId;
  incident?: Types.ObjectId;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    incident: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'IN_APP', 'BOTH'],
      default: 'BOTH',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
