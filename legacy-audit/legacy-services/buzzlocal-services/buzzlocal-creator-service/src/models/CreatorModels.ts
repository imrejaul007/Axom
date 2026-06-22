import mongoose, { Schema, Document } from 'mongoose';

export interface ICreatorProfile extends Document {
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  locality: {
    areaId: string;
    areaName: string;
  };
  specialization: string[];
  roles: CreatorRole[];
  tier: 'rising' | 'local' | 'expert' | 'authority';
  stats: {
    followers: number;
    following: number;
    posts: number;
    totalViews: number;
    engagement: number;
  };
  earnings: {
    totalEarned: number;
    pending: number;
    withdrawn: number;
  };
  badges: string[];
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatorRole =
  | 'food_scout'
  | 'nightlife_expert'
  | 'safety_guardian'
  | 'event_ambassador'
  | 'community_leader'
  | 'deal_hunter'
  | 'trust_advocate'
  | 'area_ambassador';

export interface ICreatorContent extends Document {
  creatorId: string;
  userId: string;
  type: 'post' | 'review' | 'recommendation' | 'alert' | 'deal';
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  locality: {
    areaId: string;
    areaName: string;
  };
  category: string;
  tags: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  reach: {
    organic: number;
    amplified: number;
    total: number;
  };
  engagement: number;
  createdAt: Date;
}

export interface ICreatorProgram extends Document {
  name: string;
  description: string;
  type: CreatorRole;
  requirements: {
    minFollowers: number;
    minPosts: number;
    minTrustScore: number;
    requiredBadges: string[];
  };
  benefits: {
    coins: number;
    badges: string[];
    features: string[];
    priority: number;
  };
  metrics: {
    activeMembers: number;
    totalContent: number;
    totalReach: number;
  };
  active: boolean;
  createdAt: Date;
}

export interface ICreatorEarning extends Document {
  creatorId: string;
  userId: string;
  type: 'post' | 'referral' | 'boost' | 'bonus' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  source?: {
    contentId?: string;
    type?: string;
  };
  createdAt: Date;
  processedAt?: Date;
}

// Schemas
const CreatorProfileSchema = new Schema<ICreatorProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  avatar: String,
  bio: String,
  locality: {
    areaId: { type: String, required: true },
    areaName: { type: String, required: true },
  },
  specialization: [String],
  roles: [{
    type: String,
    enum: ['food_scout', 'nightlife_expert', 'safety_guardian', 'event_ambassador', 'community_leader', 'deal_hunter', 'trust_advocate', 'area_ambassador'],
  }],
  tier: { type: String, enum: ['rising', 'local', 'expert', 'authority'], default: 'rising' },
  stats: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
  },
  earnings: {
    totalEarned: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 },
  },
  badges: [String],
  verified: { type: Boolean, default: false },
}, { timestamps: true });

CreatorProfileSchema.index({ 'locality.areaId': 1, tier: -1 });
CreatorProfileSchema.index({ roles: 1, 'stats.followers': -1 });

const CreatorContentSchema = new Schema<ICreatorContent>({
  creatorId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['post', 'review', 'recommendation', 'alert', 'deal'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: [{
    type: { type: String, enum: ['image', 'video'] },
    url: String,
  }],
  locality: {
    areaId: { type: String, required: true },
    areaName: { type: String, required: true },
  },
  category: { type: String, required: true },
  tags: [String],
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  reach: {
    organic: { type: Number, default: 0 },
    amplified: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  engagement: { type: Number, default: 0 },
}, { timestamps: true });

CreatorContentSchema.index({ creatorId: 1, createdAt: -1 });
CreatorContentSchema.index({ 'locality.areaId': 1, category: 1 });
CreatorContentSchema.index({ tags: 1 });

const CreatorProgramSchema = new Schema<ICreatorProgram>({
  name: { type: String, required: true, unique: true },
  description: String,
  type: { type: String, enum: ['food_scout', 'nightlife_expert', 'safety_guardian', 'event_ambassador', 'community_leader', 'deal_hunter', 'trust_advocate', 'area_ambassador'], required: true },
  requirements: {
    minFollowers: { type: Number, default: 0 },
    minPosts: { type: Number, default: 0 },
    minTrustScore: { type: Number, default: 0 },
    requiredBadges: [String],
  },
  benefits: {
    coins: { type: Number, default: 0 },
    badges: [String],
    features: [String],
    priority: { type: Number, default: 0 },
  },
  metrics: {
    activeMembers: { type: Number, default: 0 },
    totalContent: { type: Number, default: 0 },
    totalReach: { type: Number, default: 0 },
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const CreatorEarningSchema = new Schema<ICreatorEarning>({
  creatorId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  type: { type: String, enum: ['post', 'referral', 'boost', 'bonus', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'cancelled'], default: 'pending' },
  source: {
    contentId: String,
    type: String,
  },
  processedAt: Date,
}, { timestamps: true });

CreatorEarningSchema.index({ creatorId: 1, status: 1 });
CreatorEarningSchema.index({ createdAt: -1 });

export const CreatorProfile = mongoose.model<ICreatorProfile>('CreatorProfile', CreatorProfileSchema);
export const CreatorContent = mongoose.model<ICreatorContent>('CreatorContent', CreatorContentSchema);
export const CreatorProgram = mongoose.model<ICreatorProgram>('CreatorProgram', CreatorProgramSchema);
export const CreatorEarning = mongoose.model<ICreatorEarning>('CreatorEarning', CreatorEarningSchema);
