import mongoose, { Schema, Document } from 'mongoose';

export interface IMovementEvent extends Document {
  userId: string;
  timestamp: Date;
  origin: {
    areaId: string;
    areaName: string;
    lat: number;
    lng: number;
  };
  destination?: {
    areaId: string;
    areaName: string;
    lat: number;
    lng: number;
  };
  type: 'checkin' | 'checkout' | 'transit' | 'commute';
  context: {
    mode?: 'walk' | 'bike' | 'auto' | 'cab' | 'bus' | 'metro';
    purpose?: 'work' | 'food' | 'shopping' | 'entertainment' | 'social' | 'transit';
    duration?: number;
  };
  derived: {
    isHome?: boolean;
    isWork?: boolean;
    dwellTime?: number;
  };
}

export interface IAreaFlow extends Document {
  areaId: string;
  areaName: string;
  date: Date;
  hour: number;
  inflows: {
    fromAreaId: string;
    fromAreaName: string;
    count: number;
  }[];
  outflows: {
    toAreaId: string;
    toAreaName: string;
    count: number;
  }[];
  totalMovement: number;
  peakHour: number;
  peakFlow: number;
}

export interface ICommutePattern extends Document {
  userId: string;
  homeAreaId: string;
  homeAreaName: string;
  workAreaId: string;
  workAreaName: string;
  primaryRoute: {
    areaIds: string[];
    distance: number;
    mode: string;
    duration: number;
  };
  typicalDepartureTime: string;
  typicalArrivalTime: string;
  confidence: number;
  lastUpdated: Date;
}

export interface IMovementHotspot extends Document {
  areaId: string;
  areaName: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  currentDensity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  velocity: number;
  direction: string;
  peakHours: number[];
  category: 'transit' | 'commercial' | 'residential' | 'entertainment' | 'mixed';
  lastUpdated: Date;
}

// Schemas
const MovementEventSchema = new Schema<IMovementEvent>({
  userId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  origin: {
    areaId: { type: String, required: true },
    areaName: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  destination: {
    areaId: { type: String },
    areaName: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  type: { type: String, enum: ['checkin', 'checkout', 'transit', 'commute'], required: true },
  context: {
    mode: { type: String, enum: ['walk', 'bike', 'auto', 'cab', 'bus', 'metro'] },
    purpose: { type: String, enum: ['work', 'food', 'shopping', 'entertainment', 'social', 'transit'] },
    duration: { type: Number },
  },
  derived: {
    isHome: { type: Boolean },
    isWork: { type: Boolean },
    dwellTime: { type: Number },
  },
}, { timestamps: true });

MovementEventSchema.index({ 'origin.areaId': 1, timestamp: -1 });
MovementEventSchema.index({ userId: 1, timestamp: -1 });

const AreaFlowSchema = new Schema<IAreaFlow>({
  areaId: { type: String, required: true, index: true },
  areaName: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  hour: { type: Number, required: true, min: 0, max: 23 },
  inflows: [{
    fromAreaId: String,
    fromAreaName: String,
    count: { type: Number, default: 0 },
  }],
  outflows: [{
    toAreaId: String,
    toAreaName: String,
    count: { type: Number, default: 0 },
  }],
  totalMovement: { type: Number, default: 0 },
  peakHour: { type: Number, default: 9 },
  peakFlow: { type: Number, default: 0 },
});

AreaFlowSchema.index({ areaId: 1, date: -1 });
AreaFlowSchema.index({ areaId: 1, date: 1, hour: 1 }, { unique: true });

const CommutePatternSchema = new Schema<ICommutePattern>({
  userId: { type: String, required: true, unique: true, index: true },
  homeAreaId: { type: String, required: true },
  homeAreaName: { type: String, required: true },
  workAreaId: { type: String, required: true },
  workAreaName: { type: String, required: true },
  primaryRoute: {
    areaIds: [String],
    distance: Number,
    mode: String,
    duration: Number,
  },
  typicalDepartureTime: String,
  typicalArrivalTime: String,
  confidence: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

const MovementHotspotSchema = new Schema<IMovementHotspot>({
  areaId: { type: String, required: true, unique: true, index: true },
  areaName: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  currentDensity: { type: Number, default: 0 },
  trend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
  velocity: { type: Number, default: 0 },
  direction: { type: String, default: 'unknown' },
  peakHours: [Number],
  category: {
    type: String,
    enum: ['transit', 'commercial', 'residential', 'entertainment', 'mixed'],
    default: 'mixed'
  },
  lastUpdated: { type: Date, default: Date.now },
});

MovementHotspotSchema.index({ location: '2dsphere' });
MovementHotspotSchema.index({ category: 1, currentDensity: -1 });

export const MovementEvent = mongoose.model<IMovementEvent>('MovementEvent', MovementEventSchema);
export const AreaFlow = mongoose.model<IAreaFlow>('AreaFlow', AreaFlowSchema);
export const CommutePattern = mongoose.model<ICommutePattern>('CommutePattern', CommutePatternSchema);
export const MovementHotspot = mongoose.model<IMovementHotspot>('MovementHotspot', MovementHotspotSchema);
