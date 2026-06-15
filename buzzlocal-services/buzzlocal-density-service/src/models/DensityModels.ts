import mongoose, { Document, Schema } from 'mongoose';

export interface IAreaDensity extends Document {
  areaId: string;
  name: string;
  location: { lat: number; lng: number };
  crowdLevel: 1 | 2 | 3 | 4 | 5;
  score: number;
  factors: {
    checkIns: number;
    activeSessions: number;
    eventActivity: number;
    paymentActivity: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: Date;
}

const areaDensitySchema = new Schema({
  areaId: { type: String, required: true, unique: true },
  name: String,
  location: { lat: Number, lng: Number },
  crowdLevel: { type: Number, enum: [1, 2, 3, 4, 5], default: 2 },
  score: { type: Number, default: 50 },
  factors: {
    checkIns: { type: Number, default: 0 },
    activeSessions: { type: Number, default: 0 },
    eventActivity: { type: Number, default: 0 },
    paymentActivity: { type: Number, default: 0 }
  },
  trend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
  lastUpdated: { type: Date, default: Date.now }
});

export const AreaDensity = mongoose.model<IAreaDensity>('AreaDensity', areaDensitySchema);
