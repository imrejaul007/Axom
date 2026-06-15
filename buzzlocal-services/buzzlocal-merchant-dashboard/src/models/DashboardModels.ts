import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchantDashboard extends Document {
  merchantId: string;
  areaId: string;
  areaName: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  stats: {
    weeklyViews: number;
    weeklyEngagements: number;
    weeklyConversions: number;
    weeklyRevenue: number;
    growth: number;
  };
  demand: {
    currentLevel: 'low' | 'moderate' | 'high' | 'peak';
    trend: 'rising' | 'stable' | 'falling';
    predictedPeak: number;
  };
  competitors: {
    nearbyCount: number;
    avgRating: number;
    avgPrice: number;
  };
  insights: {
    bestTime: string;
    bestDay: string;
    popularCategory: string;
    topAudience: string;
  };
  alerts: {
    type: 'opportunity' | 'warning' | 'critical';
    message: string;
    action?: string;
  }[];
  lastUpdated: Date;
}

// External service URLs
export const EXTERNAL_SERVICES = {
  REZ_MERCHANT_INTEL: process.env.MERCHANT_INTEL_URL || 'http://localhost:4012',
  BUZZLOCAL_DENSITY: process.env.DENSITY_SERVICE_URL || 'http://localhost:4030',
  BUZZLOCAL_MOVEMENT: process.env.MOVEMENT_SERVICE_URL || 'http://localhost:4028',
  BUZZLOCAL_OFFERS: process.env.OFFERS_SERVICE_URL || 'http://localhost:4031',
};

// Schema
const MerchantDashboardSchema = new Schema<IMerchantDashboard>({
  merchantId: { type: String, required: true, unique: true, index: true },
  areaId: { type: String, required: true },
  areaName: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  stats: {
    weeklyViews: { type: Number, default: 0 },
    weeklyEngagements: { type: Number, default: 0 },
    weeklyConversions: { type: Number, default: 0 },
    weeklyRevenue: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
  },
  demand: {
    currentLevel: { type: String, enum: ['low', 'moderate', 'high', 'peak'], default: 'moderate' },
    trend: { type: String, enum: ['rising', 'stable', 'falling'], default: 'stable' },
    predictedPeak: { type: Number, default: 0 },
  },
  competitors: {
    nearbyCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    avgPrice: { type: Number, default: 0 },
  },
  insights: {
    bestTime: { type: String, default: '12:00' },
    bestDay: { type: String, default: 'Saturday' },
    popularCategory: { type: String, default: '' },
    topAudience: { type: String, default: '' },
  },
  alerts: [{
    type: { type: String, enum: ['opportunity', 'warning', 'critical'] },
    message: String,
    action: String,
  }],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

MerchantDashboardSchema.index({ location: '2dsphere' });
MerchantDashboardSchema.index({ areaId: 1, 'demand.currentLevel': -1 });

export const MerchantDashboard = mongoose.model<IMerchantDashboard>('MerchantDashboard', MerchantDashboardSchema);
