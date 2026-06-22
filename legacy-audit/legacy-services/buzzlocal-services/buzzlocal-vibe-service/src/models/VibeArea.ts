import mongoose, { Schema, Document } from 'mongoose';

export type AreaMood = 'chill' | 'busy' | 'party' | 'family';
export type CrowdLevel = 1 | 2 | 3 | 4 | 5;

export interface IVibeArea extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  mood: AreaMood;
  crowdLevel: CrowdLevel;
  trending: boolean;
  activeUsers: number;
  peakHours: number[]; // 0-23
  moodHistory: {
    mood: AreaMood;
    timestamp: Date;
  }[];
  updatedAt: Date;
}

const VibeAreaSchema = new Schema<IVibeArea>(
  {
    name: { type: String, required: true, index: true },
    center: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    radius: { type: Number, default: 1000 },
    mood: {
      type: String,
      enum: ['chill', 'busy', 'party', 'family'],
      default: 'chill',
    },
    crowdLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    trending: { type: Boolean, default: false },
    activeUsers: { type: Number, default: 0 },
    peakHours: [{ type: Number, min: 0, max: 23 }],
    moodHistory: [{
      mood: String,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

// Index for geospatial queries
VibeAreaSchema.index({ 'center.latitude': 1, 'center.longitude': 1 });

export const VibeAreaModel = mongoose.model<IVibeArea>('VibeArea', VibeAreaSchema);
