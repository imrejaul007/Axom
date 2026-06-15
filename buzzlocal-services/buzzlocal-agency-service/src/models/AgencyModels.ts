import mongoose, { Document, Schema } from 'mongoose';

// Agency Types
export type AgencyType =
  | 'bbmp'
  | 'metro'
  | 'traffic'
  | 'weather'
  | 'bescom'
  | 'bwssb'
  | 'fire'
  | 'police'
  | 'custom';

// Alert Priority
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

// Agency Alert
export interface IAgencyAlert extends Document {
  id: string;
  source: AgencyType;
  sourceId: string;
  title: string;
  description: string;
  type: string;
  priority: AlertPriority;
  location?: {
    lat: number;
    lng: number;
    address: string;
    area?: string;
  };
  affectedAreas: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  metadata: Record<string, unknown>;
  verified: boolean;
  userAlerts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Agency Source
export interface IAgencySource extends Document {
  name: string;
  type: AgencyType;
  webhookUrl?: string;
  apiUrl?: string;
  apiKey?: string;
  isActive: boolean;
  lastFetch?: Date;
  fetchInterval: number;
  priority: number;
  createdAt: Date;
}

// User Subscription
export interface IUserSubscription extends Document {
  userId: string;
  sources: AgencyType[];
  areas: string[];
  notifyOn: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  createdAt: Date;
}

// Schema
const locationSchema = new Schema({
  lat: Number,
  lng: Number,
  address: String,
  area: String
}, { _id: false });

const agencyAlertSchema = new Schema({
  source: {
    type: String,
    enum: ['bbmp', 'metro', 'traffic', 'weather', 'bescom', 'bwssb', 'fire', 'police', 'custom'],
    required: true,
    index: true
  },
  sourceId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: locationSchema,
  affectedAreas: [{ type: String }],
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  isActive: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed },
  verified: { type: Boolean, default: true },
  userAlerts: { type: Number, default: 0 }
}, { timestamps: true });

agencyAlertSchema.index({ source: 1, sourceId: 1 }, { unique: true });
agencyAlertSchema.index({ isActive: 1, priority: 1, createdAt: -1 });
agencyAlertSchema.index({ affectedAreas: 1 });

const agencySourceSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['bbmp', 'metro', 'traffic', 'weather', 'bescom', 'bwssb', 'fire', 'police', 'custom'],
    required: true
  },
  webhookUrl: String,
  apiUrl: String,
  apiKey: String,
  isActive: { type: Boolean, default: true },
  lastFetch: Date,
  fetchInterval: { type: Number, default: 300 }, // seconds
  priority: { type: Number, default: 1 }
}, { timestamps: true });

const userSubscriptionSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  sources: [{
    type: String,
    enum: ['bbmp', 'metro', 'traffic', 'weather', 'bescom', 'bwssb', 'fire', 'police']
  }],
  areas: [{ type: String }],
  notifyOn: {
    low: { type: Boolean, default: true },
    medium: { type: Boolean, default: true },
    high: { type: Boolean, default: true },
    critical: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Models
export const AgencyAlert = mongoose.model<IAgencyAlert>('AgencyAlert', agencyAlertSchema);
export const AgencySource = mongoose.model<IAgencySource>('AgencySource', agencySourceSchema);
export const UserSubscription = mongoose.model<IUserSubscription>('UserSubscription', userSubscriptionSchema);
