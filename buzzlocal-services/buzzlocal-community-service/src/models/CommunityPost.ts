import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  _id: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  authorId: string;
  content: string;
  media?: { type: 'image' | 'video'; url: string }[];
  likes: string[];
  comments: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    authorId: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    media: [{
      type: { type: String, enum: ['image', 'video'] },
      url: String,
    }],
    likes: [{ type: String }],
    comments: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ communityId: 1, createdAt: -1 });

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
