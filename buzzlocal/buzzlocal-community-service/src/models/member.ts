import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityMember extends Document {
  _id: mongoose.Types.ObjectId;
  communityId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastActiveAt: Date;
  status: 'active' | 'banned' | 'left';
  karma: number;
}

const CommunityMemberSchema = new Schema<ICommunityMember>(
  {
    communityId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'banned', 'left'],
      default: 'active',
    },
    karma: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'community_members',
  }
);

// Compound unique index
CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMemberSchema.index({ communityId: 1, role: 1 });
CommunityMemberSchema.index({ communityId: 1, status: 1 });
CommunityMemberSchema.index({ userId: 1, status: 1 });

export const CommunityMember = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);