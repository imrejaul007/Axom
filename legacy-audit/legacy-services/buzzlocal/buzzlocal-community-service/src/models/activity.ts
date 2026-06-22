import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  communityId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    communityId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'activity_logs',
  }
);

// Indexes
ActivityLogSchema.index({ communityId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);