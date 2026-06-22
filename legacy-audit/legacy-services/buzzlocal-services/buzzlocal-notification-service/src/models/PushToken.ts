import mongoose, { Schema, Document } from 'mongoose';

export interface IPushToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  token: string;
  platform: 'expo' | 'ios' | 'android';
  deviceId?: string;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushTokenSchema = new Schema<IPushToken>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['expo', 'ios', 'android'], default: 'expo' },
    deviceId: String,
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PushTokenSchema.index({ token: 1 }, { unique: true });
PushTokenSchema.index({ userId: 1, platform: 1 });

export const PushToken = mongoose.model<IPushToken>('PushToken', PushTokenSchema);
