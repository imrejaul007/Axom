import mongoose, { Schema, Document } from 'mongoose';

export interface ILocalInsight extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'area_trending' | 'event_prediction' | 'crowd_mood' | 'topic_trend' | 'user_preference';
  area?: string;
  city?: string;
  data;
  confidence: number;
  source: 'ai' | 'aggregated' | 'manual';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocalInsightSchema = new Schema<ILocalInsight>(
  {
    type: {
      type: String,
      enum: ['area_trending', 'event_prediction', 'crowd_mood', 'topic_trend', 'user_preference'],
      required: true,
      index: true,
    },
    area: { type: String, index: true },
    city: { type: String, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    source: { type: String, enum: ['ai', 'aggregated', 'manual'], default: 'ai' },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

LocalInsightSchema.index({ type: 1, area: 1, createdAt: -1 });

export const LocalInsight = mongoose.model<ILocalInsight>('LocalInsight', LocalInsightSchema);
