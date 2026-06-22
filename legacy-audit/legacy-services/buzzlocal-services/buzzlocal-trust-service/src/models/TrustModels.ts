import mongoose, { Document, Schema } from 'mongoose';

// Trust Levels
export type TrustLevel = 'new' | 'verified' | 'trusted' | 'expert' | 'guardian' | 'legend';

// Verification Types
export type VerificationType = 'phone' | 'email' | 'address' | 'society' | 'id' | 'merchant';

// Badge Types
export interface IBadge extends Document {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    value: number;
  };
}

// Trust Profile
export interface ITrustProfile extends Document {
  userId: string;
  score: number;
  level: TrustLevel;
  verification: {
    phone: boolean;
    email: boolean;
    address: boolean;
    society: boolean;
    id: boolean;
    merchant: boolean;
  };
  verificationDetails: {
    phoneVerifiedAt?: Date;
    emailVerifiedAt?: Date;
    addressVerifiedAt?: Date;
    societyVerifiedAt?: Date;
    idVerifiedAt?: Date;
    merchantVerifiedAt?: Date;
  };
  stats: {
    posts: number;
    answers: number;
    helpfulAnswers: number;
    followers: number;
    following: number;
    alerts: number;
    verifiedAlerts: number;
    eventsAttended: number;
    placesDiscovered: number;
  };
  badges: {
    badgeId: string;
    earnedAt: Date;
    area?: string;
  }[];
  neighborhoods: {
    neighborhoodId: string;
    name: string;
    checkInCount: number;
    lastCheckIn: Date;
  }[];
  area?: string;
  primaryNeighborhood?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Neighborhood
export interface INeighborhood extends Document {
  name: string;
  type: 'area' | 'apartment' | 'layout' | 'campus' | 'society';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    pincode: string;
  };
  boundaries?: {
    type: string;
    coordinates: number[][];
  };
  parentNeighborhood?: string;
  memberCount: number;
  activeMembers: number;
  createdAt: Date;
}

// Verification Request
export interface IVerificationRequest extends Document {
  userId: string;
  type: VerificationType;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, unknown>;
  documents?: string[];
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trust Event (for tracking score changes)
export interface ITrustEvent extends Document {
  userId: string;
  type: string;
  action: 'credit' | 'debit';
  points: number;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Badge Definitions
export const BADGE_DEFINITIONS = [
  {
    id: 'first_post',
    name: 'First Post',
    icon: '🎉',
    description: 'Created your first post',
    rarity: 'common' as const,
    criteria: { type: 'posts', value: 1 }
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '🗺️',
    description: 'Check-in at 10 different places',
    rarity: 'common' as const,
    criteria: { type: 'placesDiscovered', value: 10 }
  },
  {
    id: 'food_scout',
    name: 'Food Scout',
    icon: '🍔',
    description: 'Posted 20 food reviews or places',
    rarity: 'common' as const,
    criteria: { type: 'foodPosts', value: 20 }
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    icon: '🦉',
    description: 'Posted after 10pm 5 times',
    rarity: 'rare' as const,
    criteria: { type: 'lateNightPosts', value: 5 }
  },
  {
    id: 'event_hunter',
    name: 'Event Hunter',
    icon: '🎯',
    description: 'Attended 5 events',
    rarity: 'rare' as const,
    criteria: { type: 'eventsAttended', value: 5 }
  },
  {
    id: 'safety_hero',
    name: 'Safety Hero',
    icon: '🚨',
    description: 'Posted 5 verified safety alerts',
    rarity: 'rare' as const,
    criteria: { type: 'verifiedAlerts', value: 5 }
  },
  {
    id: 'helper',
    name: 'Helper',
    icon: '🤝',
    description: 'Posted 20 helpful answers',
    rarity: 'rare' as const,
    criteria: { type: 'helpfulAnswers', value: 20 }
  },
  {
    id: 'local_legend',
    name: 'Local Legend',
    icon: '⭐',
    description: '100+ followers in one area',
    rarity: 'epic' as const,
    criteria: { type: 'followers', value: 100 }
  },
  {
    id: 'truth_teller',
    name: 'Truth Teller',
    icon: '✅',
    description: '10 accurate alerts verified by community',
    rarity: 'rare' as const,
    criteria: { type: 'verifiedAlerts', value: 10 }
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    icon: '🐦',
    description: 'Discovered 5 new places first',
    rarity: 'epic' as const,
    criteria: { type: 'firstDiscoveries', value: 5 }
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    icon: '🦋',
    description: 'Connected with 50+ people',
    rarity: 'rare' as const,
    criteria: { type: 'following', value: 50 }
  },
  {
    id: 'trusted_answerer',
    name: 'Trusted Answerer',
    icon: '🏆',
    description: 'Earned trust level through helpful answers',
    rarity: 'epic' as const,
    criteria: { type: 'helpfulAnswers', value: 50 }
  },
  {
    id: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    description: '50 verified safety contributions',
    rarity: 'epic' as const,
    criteria: { type: 'safetyContributions', value: 50 }
  },
  {
    id: 'city_scout',
    name: 'City Scout',
    icon: '🏙️',
    description: 'Discovered places in 10 different neighborhoods',
    rarity: 'legendary' as const,
    criteria: { type: 'neighborhoodsExplored', value: 10 }
  },
  {
    id: 'legend',
    name: 'City Legend',
    icon: '👑',
    description: 'Top contributor in your city',
    rarity: 'legendary' as const,
    criteria: { type: 'cityRank', value: 1 }
  }
];

// Level thresholds
export const LEVEL_THRESHOLDS: Record<TrustLevel, number> = {
  new: 0,
  verified: 50,
  trusted: 100,
  expert: 250,
  guardian: 500,
  legend: 1000
};

// Score weights
export const SCORE_WEIGHTS = {
  verification: {
    phone: 10,
    email: 5,
    address: 25,
    society: 30,
    id: 20,
    merchant: 15
  },
  activity: {
    post: 5,
    answer: 3,
    helpfulAnswer: 10,
    comment: 1,
    like: 1,
    share: 2,
    follow: 1,
    checkIn: 2
  },
  accuracy: {
    helpfulVote: 5,
    verifiedAlert: 15,
    accurateReport: 10
  },
  community: {
    follower: 2,
    answerAccepted: 10,
    thanksReceived: 3
  },
  safety: {
    verifiedAlert: 20,
    safetyHelp: 15,
    falseReport: -50
  }
};

// Schemas
const badgeEarnedSchema = new Schema({
  badgeId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  area: String
}, { _id: false });

const neighborhoodCheckInSchema = new Schema({
  neighborhoodId: { type: String, required: true },
  name: String,
  checkInCount: { type: Number, default: 1 },
  lastCheckIn: { type: Date, default: Date.now }
}, { _id: false });

const trustProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  score: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['new', 'verified', 'trusted', 'expert', 'guardian', 'legend'],
    default: 'new'
  },
  verification: {
    phone: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    address: { type: Boolean, default: false },
    society: { type: Boolean, default: false },
    id: { type: Boolean, default: false },
    merchant: { type: Boolean, default: false }
  },
  verificationDetails: {
    phoneVerifiedAt: Date,
    emailVerifiedAt: Date,
    addressVerifiedAt: Date,
    societyVerifiedAt: Date,
    idVerifiedAt: Date,
    merchantVerifiedAt: Date
  },
  stats: {
    posts: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    helpfulAnswers: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    alerts: { type: Number, default: 0 },
    verifiedAlerts: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 },
    placesDiscovered: { type: Number, default: 0 }
  },
  badges: [badgeEarnedSchema],
  neighborhoods: [neighborhoodCheckInSchema],
  area: String,
  primaryNeighborhood: String
}, { timestamps: true });

const verificationRequestSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['phone', 'email', 'address', 'society', 'id', 'merchant'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  data: { type: Schema.Types.Mixed },
  documents: [{ type: String }],
  verifiedBy: String,
  verifiedAt: Date,
  rejectionReason: String
}, { timestamps: true });

const trustEventSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  action: { type: String, enum: ['credit', 'debit'], required: true },
  points: { type: Number, required: true },
  reason: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

const neighborhoodSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['area', 'apartment', 'layout', 'campus', 'society'],
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
    city: String,
    pincode: String
  },
  boundaries: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: [[Number]]
  },
  parentNeighborhood: String,
  memberCount: { type: Number, default: 0 },
  activeMembers: { type: Number, default: 0 }
}, { timestamps: true });

// Create models
export const TrustProfile = mongoose.model<ITrustProfile>('TrustProfile', trustProfileSchema);
export const VerificationRequest = mongoose.model<IVerificationRequest>('VerificationRequest', verificationRequestSchema);
export const TrustEvent = mongoose.model<ITrustEvent>('TrustEvent', trustEventSchema);
export const Neighborhood = mongoose.model<INeighborhood>('Neighborhood', neighborhoodSchema);
