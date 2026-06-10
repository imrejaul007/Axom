import mongoose, { Schema, Document } from 'mongoose';

export interface IEngagement extends Document {
  postId: string;
  userId: string;
  type: 'like' | 'comment' | 'share' | 'view';
  content?: string;
  createdAt: Date;
}

const EngagementSchema = new Schema<IEngagement>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['like', 'comment', 'share', 'view'], required: true },
    content: { type: String, maxlength: 2000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'engagements',
  }
);

// Compound unique index for likes (user can only like once)
EngagementSchema.index({ postId: 1, userId: 1, type: 1 }, { unique: true });
EngagementSchema.index({ postId: 1, type: 1, createdAt: -1 });

export const Engagement = mongoose.model<IEngagement>('Engagement', EngagementSchema);