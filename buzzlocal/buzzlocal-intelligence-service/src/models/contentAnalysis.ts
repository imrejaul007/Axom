import mongoose, { Schema, Document } from 'mongoose';
import { ContentAnalysisResult } from '../types/index.js';

export interface IContentAnalysis extends Document {
  contentId: string;
  userId: string;
  text: string;
  context: 'post' | 'comment' | 'message' | 'profile';
  moderation: {
    passed: boolean;
    categories: Array<{ category: string; confidence: number; matched: boolean }>;
    confidence: number;
    action: 'allow' | 'warn' | 'block';
  };
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: {
      joy: number;
      anger: number;
      sadness: number;
      fear: number;
      surprise: number;
    };
  };
  spam: {
    isSpam: boolean;
    score: number;
    reasons: string[];
    confidence: number;
  };
  toxicity: {
    isToxic: boolean;
    score: number;
    categories: Array<{ type: string; score: number }>;
    confidence: number;
  };
  flagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmotionScoresSchema = new Schema(
  {
    joy: { type: Number, default: 0 },
    anger: { type: Number, default: 0 },
    sadness: { type: Number, default: 0 },
    fear: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
  },
  { _id: false }
);

const ModerationCategorySchema = new Schema(
  {
    category: { type: String, required: true },
    confidence: { type: Number, required: true },
    matched: { type: Boolean, required: true },
  },
  { _id: false }
);

const ToxicityCategorySchema = new Schema(
  {
    type: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const ContentAnalysisSchema = new Schema<IContentAnalysis>(
  {
    contentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    context: {
      type: String,
      enum: ['post', 'comment', 'message', 'profile'],
      default: 'post',
    },
    moderation: {
      passed: { type: Boolean, required: true },
      categories: [ModerationCategorySchema],
      confidence: { type: Number, required: true },
      action: { type: String, enum: ['allow', 'warn', 'block'], required: true },
    },
    sentiment: {
      score: { type: Number, required: true },
      label: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
      confidence: { type: Number, required: true },
      emotions: { type: EmotionScoresSchema, required: true },
    },
    spam: {
      isSpam: { type: Boolean, required: true },
      score: { type: Number, required: true },
      reasons: [{ type: String }],
      confidence: { type: Number, required: true },
    },
    toxicity: {
      isToxic: { type: Boolean, required: true },
      score: { type: Number, required: true },
      categories: [ToxicityCategorySchema],
      confidence: { type: Number, required: true },
    },
    flagged: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    collection: 'content_analyses',
  }
);

// Indexes for efficient querying
ContentAnalysisSchema.index({ createdAt: -1 });
ContentAnalysisSchema.index({ flagged: 1, createdAt: -1 });
ContentAnalysisSchema.index({ userId: 1, createdAt: -1 });
ContentAnalysisSchema.index({ 'sentiment.label': 1 });
ContentAnalysisSchema.index({ 'toxicity.isToxic': 1 });

export const ContentAnalysis = mongoose.model<IContentAnalysis>('ContentAnalysis', ContentAnalysisSchema);
