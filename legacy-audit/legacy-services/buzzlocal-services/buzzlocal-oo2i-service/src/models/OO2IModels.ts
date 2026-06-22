import mongoose, { Schema, Document } from 'mongoose';

export interface IQRKiosk extends Document {
  kioskId: string;
  type: 'society' | 'merchant' | 'event' | 'transit';
  ownerId: string;
  ownerType: 'society' | 'merchant' | 'event';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  areaId: string;
  areaName: string;
  status: 'active' | 'inactive' | 'maintenance';
  display: {
    screenSize: string;
    orientation: 'portrait' | 'landscape';
  };
  stats: {
    totalScans: number;
    uniqueUsers: number;
    lastScan: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocationTrigger extends Document {
  triggerId: string;
  type: 'proximity' | 'time' | 'event' | 'qr_scan';
  condition: {
    areaId?: string;
    radius?: number;
    timeRange?: { start: string; end: string };
    eventId?: string;
    category?: string;
  };
  action: {
    type: 'offer' | 'notification' | 'deeplink' | 'content';
    payload: Record<string, any>;
  };
  active: boolean;
  priority: number;
  createdAt: Date;
}

export interface IDOOHIntegration extends Document {
  screenId: string;
  screenName: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  areaId: string;
  areaName: string;
  ownerId: string;
  screenType: 'billboard' | 'kiosk' | 'taxi' | 'elevator' | 'restaurant';
  specs: {
    width: number;
    height: number;
    orientation: string;
  };
  content: {
    currentContent: string;
    schedule: any[];
  };
  stats: {
    impressions: number;
    interactions: number;
    conversions: number;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

export interface IQRScan extends Document {
  scanId: string;
  qrId: string;
  qrType: 'society' | 'merchant' | 'event' | 'offer' | 'product';
  userId?: string;
  guestId?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  areaId: string;
  areaName: string;
  source: 'app' | 'camera' | 'kiosk';
  triggeredBy?: 'proximity' | 'manual' | 'scheduled';
  conversion?: {
    action: string;
    timestamp: Date;
  };
  createdAt: Date;
}

// Schemas
const QRKioskSchema = new Schema<IQRKiosk>({
  kioskId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['society', 'merchant', 'event', 'transit'], required: true },
  ownerId: { type: String, required: true, index: true },
  ownerType: { type: String, enum: ['society', 'merchant', 'event'], required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  address: String,
  areaId: { type: String, required: true },
  areaName: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  display: {
    screenSize: String,
    orientation: { type: String, enum: ['portrait', 'landscape'] },
  },
  stats: {
    totalScans: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    lastScan: Date,
  },
}, { timestamps: true });

QRKioskSchema.index({ location: '2dsphere' });
QRKioskSchema.index({ areaId: 1, status: 1 });

const LocationTriggerSchema = new Schema<ILocationTrigger>({
  triggerId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['proximity', 'time', 'event', 'qr_scan'], required: true },
  condition: {
    areaId: String,
    radius: Number,
    timeRange: {
      start: String,
      end: String,
    },
    eventId: String,
    category: String,
  },
  action: {
    type: { type: String, enum: ['offer', 'notification', 'deeplink', 'content'], required: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  active: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
}, { timestamps: true });

const DOOHIntegrationSchema = new Schema<IDOOHIntegration>({
  screenId: { type: String, required: true, unique: true, index: true },
  screenName: String,
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  areaId: { type: String, required: true },
  areaName: { type: String, required: true },
  ownerId: String,
  screenType: { type: String, enum: ['billboard', 'kiosk', 'taxi', 'elevator', 'restaurant'], required: true },
  specs: {
    width: Number,
    height: Number,
    orientation: String,
  },
  content: {
    currentContent: String,
    schedule: [Schema.Types.Mixed],
  },
  stats: {
    impressions: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
}, { timestamps: true });

DOOHIntegrationSchema.index({ location: '2dsphere' });
DOOHIntegrationSchema.index({ areaId: 1, status: 1 });

const QRScanSchema = new Schema<IQRScan>({
  scanId: { type: String, required: true, unique: true, index: true },
  qrId: { type: String, required: true, index: true },
  qrType: { type: String, enum: ['society', 'merchant', 'event', 'offer', 'product'], required: true },
  userId: String,
  guestId: String,
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  areaId: { type: String, required: true },
  areaName: { type: String, required: true },
  source: { type: String, enum: ['app', 'camera', 'kiosk'], required: true },
  triggeredBy: { type: String, enum: ['proximity', 'manual', 'scheduled'] },
  conversion: {
    action: String,
    timestamp: Date,
  },
}, { timestamps: true });

QRScanSchema.index({ qrId: 1, createdAt: -1 });
QRScanSchema.index({ areaId: 1, createdAt: -1 });
QRScanSchema.index({ location: '2dsphere' });

export const QRKiosk = mongoose.model<IQRKiosk>('QRKiosk', QRKioskSchema);
export const LocationTrigger = mongoose.model<ILocationTrigger>('LocationTrigger', LocationTriggerSchema);
export const DOOHIntegration = mongoose.model<IDOOHIntegration>('DOOHIntegration', DOOHIntegrationSchema);
export const QRScan = mongoose.model<IQRScan>('QRScan', QRScanSchema);
