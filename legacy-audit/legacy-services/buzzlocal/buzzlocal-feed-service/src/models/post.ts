import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  userId: string;
  content: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    width?: number;
    height?: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    area?: string;
    city?: string;
  };
  communityId?: string;
  isAiGenerated: boolean;
  aiCard?: {
    type: 'weather' | 'news' | 'trending' | 'tip' | 'event' | 'poll';
    title: string;
    description: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
    actionUrl?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  thumbnail: { type: String },
  width: { type: Number },
  height: { type: Number },
}, { _id: false });

const LocationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  area: { type: String },
  city: { type: String },
}, { _id: false });

const AICardSchema = new Schema({
  type: { type: String, enum: ['weather', 'news', 'trending', 'tip', 'event', 'poll'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  imageUrl: { type: String },
  actionUrl: { type: String },
}, { _id: false });

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true, maxlength: 5000 },
    media: [MediaSchema],
    location: LocationSchema,
    communityId: { type: String, index: true },
    isAiGenerated: { type: Boolean, default: false },
    aiCard: AICardSchema,
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'posts',
  }
);

// Indexes
PostSchema.index({ createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ communityId: 1, createdAt: -1 });
PostSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
PostSchema.index({ engagement: -1, createdAt: -1 });
PostSchema.index({ isAiGenerated: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);