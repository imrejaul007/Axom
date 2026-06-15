import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  ownerId: string;
  moderators: string[];
  memberCount: number;
  isPrivate: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 1000 },
    icon: { type: String },
    coverImage: { type: String },
    ownerId: { type: String, required: true, index: true },
    moderators: [{ type: String, index: true }],
    memberCount: { type: Number, default: 1 },
    isPrivate: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'communities',
  }
);

// Indexes
CommunitySchema.index({ name: 'text', description: 'text' });
CommunitySchema.index({ createdAt: -1 });
CommunitySchema.index({ memberCount: -1 });
CommunitySchema.index({ isPrivate: 1, isActive: 1 });

export const Community = mongoose.model<ICommunity>('Community', CommunitySchema);