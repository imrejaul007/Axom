import mongoose, { Document, Schema } from 'mongoose';

// Query Categories
export type QueryCategory =
  | 'food_drink'
  | 'safety'
  | 'services'
  | 'housing'
  | 'events'
  | 'commerce'
  | 'health'
  | 'transport'
  | 'general';

// Answer Types
export type AnswerType = 'ai' | 'expert' | 'community' | 'verified';

// Answer Status
export type AnswerStatus = 'pending' | 'helpful' | 'verified' | 'rejected';

// Interface for Ask Query
export interface IAskQuery extends Document {
  userId: string;
  userTrustLevel: string;
  query: string;
  category: QueryCategory;
  intentType?: string;
  location?: {
    lat: number;
    lng: number;
    area?: string;
    address?: string;
  };
  context?: {
    conversationId?: string;
    previousQuery?: string;
  };
  status: 'pending' | 'processing' | 'answered' | 'expired';
  response?: {
    answer: string;
    sources: AnswerSource[];
    suggestedFollowUps?: string[];
  };
  conversationId: string;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// Answer Source
export interface AnswerSource {
  type: 'ai' | 'expert' | 'community' | 'location';
  id?: string;
  name?: string;
  title?: string;
  confidence?: number;
  badge?: string;
}

// Interface for Ask Answer
export interface IAskAnswer extends Document {
  queryId: string;
  conversationId: string;
  userId: string;
  userTrustLevel: string;
  userTrustScore: number;
  userArea?: string;
  content: string;
  type: AnswerType;
  status: AnswerStatus;
  source?: string;
  expertDomain?: string;
  helpful: number;
  notHelpful: number;
  helpfulByUsers: string[];
  notHelpfulByUsers: string[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Conversation Thread
export interface IConversationThread extends Document {
  conversationId: string;
  userId: string;
  location?: {
    lat: number;
    lng: number;
    area?: string;
  };
  queries: {
    queryId: string;
    query: string;
    category: QueryCategory;
    createdAt: Date;
  }[];
  currentQueryId?: string;
  lastActivity: Date;
  createdAt: Date;
}

// Schemas
const locationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  area: String,
  address: String
}, { _id: false });

const answerSourceSchema = new Schema({
  type: { type: String, enum: ['ai', 'expert', 'community', 'location'], required: true },
  id: String,
  name: String,
  title: String,
  confidence: Number,
  badge: String
}, { _id: false });

const askQuerySchema = new Schema({
  userId: { type: String, required: true, index: true },
  userTrustLevel: { type: String, default: 'new' },
  query: { type: String, required: true },
  category: {
    type: String,
    enum: ['food_drink', 'safety', 'services', 'housing', 'events', 'commerce', 'health', 'transport', 'general'],
    required: true
  },
  intentType: String,
  location: locationSchema,
  context: {
    conversationId: String,
    previousQuery: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'answered', 'expired'],
    default: 'pending'
  },
  response: {
    answer: String,
    sources: [answerSourceSchema],
    suggestedFollowUps: [String]
  },
  conversationId: { type: String, required: true, index: true },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

const askAnswerSchema = new Schema({
  queryId: { type: Schema.Types.ObjectId, ref: 'AskQuery', required: true, index: true },
  conversationId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userTrustLevel: { type: String, default: 'new' },
  userTrustScore: { type: Number, default: 0 },
  userArea: String,
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['ai', 'expert', 'community', 'verified'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'helpful', 'verified', 'rejected'],
    default: 'pending'
  },
  source: String,
  expertDomain: String,
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  helpfulByUsers: [{ type: String }],
  notHelpfulByUsers: [{ type: String }],
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const queryInThreadSchema = new Schema({
  queryId: { type: String, required: true },
  query: { type: String, required: true },
  category: { type: String, enum: ['food_drink', 'safety', 'services', 'housing', 'events', 'commerce', 'health', 'transport', 'general'] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const conversationThreadSchema = new Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  location: locationSchema,
  queries: [queryInThreadSchema],
  currentQueryId: String,
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
export const AskQuery = mongoose.model<IAskQuery>('AskQuery', askQuerySchema);
export const AskAnswer = mongoose.model<IAskAnswer>('AskAnswer', askAnswerSchema);
export const ConversationThread = mongoose.model<IConversationThread>('ConversationThread', conversationThreadSchema);
