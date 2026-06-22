import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  type: 'post' | 'event' | 'community' | 'alert' | 'reward' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  isDelivered: boolean;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['post', 'event', 'community', 'alert', 'reward', 'system'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    isDelivered: { type: Boolean, default: false },
    sentAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
