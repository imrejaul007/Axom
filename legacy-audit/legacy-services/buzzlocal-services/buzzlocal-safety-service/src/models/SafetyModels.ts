import mongoose, { Document, Schema } from 'mongoose';

// Alert Types
export type AlertType =
  | 'suspicious'
  | 'road'
  | 'crime'
  | 'hazard'
  | 'traffic'
  | 'infrastructure'
  | 'women_safety'
  | 'emergency';

// Alert Severity
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Alert Status
export type AlertStatus = 'active' | 'verified' | 'resolved' | 'false' | 'expired';

// Safety Level
export type SafetyLevel = 'safe' | 'moderate' | 'caution' | 'unsafe';

// Safety Alert
export interface ISafetyAlert extends Document {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
    pincode?: string;
  };
  description: string;
  title: string;
  evidence?: string[];
  images?: string[];
  credibility: number;
  verificationScore: number;
  reports: {
    userId: string;
    vote: 'confirm' | 'dispute';
    comment?: string;
    trustLevel: string;
    timestamp: Date;
  }[];
  confirmedBy: string[];
  disputedBy: string[];
  author: {
    userId: string;
    trustLevel: string;
    trustScore: number;
    area: string;
  };
  expiresAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trusted Circle (Women Safety)
export interface ITrustedCircle extends Document {
  userId: string;
  members: {
    userId: string;
    name: string;
    phone: string;
    relationship: string;
    notifyOn: 'always' | 'emergency_only';
    addedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Safety Check-in
export interface ISafetyCheckIn extends Document {
  userId: string;
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  status: 'safe' | 'concerned' | 'emergency';
  note?: string;
  expectedDuration?: number;
  autoAlertAt?: Date;
  alertedContacts: string[];
  createdAt: Date;
}

// Safety Profile
export interface ISafetyProfile extends Document {
  userId: string;
  womenModeEnabled: boolean;
  shareLocationWith: 'everyone' | 'circle_only' | 'nobody';
  autoCheckIn: boolean;
  checkInInterval: number;
  emergencyContacts: string[];
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Area Safety Score
export interface IAreaSafety extends Document {
  areaId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  safetyLevel: SafetyLevel;
  score: number;
  factors: {
    lighting: number;
    crowdDensity: number;
    crimeRate: number;
    responseTime: number;
    verifiedAlerts: number;
  };
  activeAlerts: number;
  lastUpdated: Date;
}

// Emergency Contact
export interface IEmergencyContact extends Document {
  userId: string;
  type: 'police' | 'ambulance' | 'fire' | 'women_helpline' | 'custom';
  name: string;
  phone: string;
  address?: string;
  lat?: number;
  lng?: number;
  distance?: number;
}

// Credibility Weights
export const CREDIBILITY_WEIGHTS = {
  gps_match: 20,
  multiple_reports: 30,
  trusted_user: 15,
  photo_evidence: 25,
  video_evidence: 30,
  new_user: -10,
  vague_description: -15,
  previous_false: -50
};

// Schemas
const locationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: String,
  area: String,
  pincode: String
}, { _id: false });

const reportSchema = new Schema({
  userId: { type: String, required: true },
  vote: { type: String, enum: ['confirm', 'dispute'], required: true },
  comment: String,
  trustLevel: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const safetyAlertSchema = new Schema({
  type: {
    type: String,
    enum: ['suspicious', 'road', 'crime', 'hazard', 'traffic', 'infrastructure', 'women_safety', 'emergency'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'verified', 'resolved', 'false', 'expired'],
    default: 'active'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: locationSchema, required: true },
  evidence: [{ type: String }],
  images: [{ type: String }],
  credibility: { type: Number, default: 0 },
  verificationScore: { type: Number, default: 0 },
  reports: [reportSchema],
  confirmedBy: [{ type: String }],
  disputedBy: [{ type: String }],
  author: {
    userId: { type: String, required: true },
    trustLevel: String,
    trustScore: Number,
    area: String
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  resolvedAt: Date,
  resolvedBy: String,
  resolution: String
}, { timestamps: true });

safetyAlertSchema.index({ 'location.area': 1, status: 1 });
safetyAlertSchema.index({ 'location.lat': 1, 'location.lng': 1 });
safetyAlertSchema.index({ status: 1, createdAt: -1 });

const trustedCircleSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  members: [{
    userId: { type: String, required: true },
    name: String,
    phone: String,
    relationship: String,
    notifyOn: { type: String, enum: ['always', 'emergency_only'], default: 'always' },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const safetyCheckInSchema = new Schema({
  userId: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
    area: String
  },
  status: { type: String, enum: ['safe', 'concerned', 'emergency'], default: 'safe' },
  note: String,
  expectedDuration: Number,
  autoAlertAt: Date,
  alertedContacts: [{ type: String }]
}, { timestamps: true });

const safetyProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  womenModeEnabled: { type: Boolean, default: false },
  shareLocationWith: { type: String, enum: ['everyone', 'circle_only', 'nobody'], default: 'circle_only' },
  autoCheckIn: { type: Boolean, default: false },
  checkInInterval: { type: Number, default: 30 },
  emergencyContacts: [{ type: String }],
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    conditions: [String]
  }
}, { timestamps: true });

const areaSafetySchema = new Schema({
  areaId: { type: String, required: true, unique: true },
  name: String,
  location: {
    lat: Number,
    lng: Number
  },
  safetyLevel: {
    type: String,
    enum: ['safe', 'moderate', 'caution', 'unsafe'],
    default: 'moderate'
  },
  score: { type: Number, default: 50 },
  factors: {
    lighting: { type: Number, default: 50 },
    crowdDensity: { type: Number, default: 50 },
    crimeRate: { type: Number, default: 50 },
    responseTime: { type: Number, default: 50 },
    verifiedAlerts: { type: Number, default: 50 }
  },
  activeAlerts: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const emergencyContactSchema = new Schema({
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['police', 'ambulance', 'fire', 'women_helpline', 'custom'],
    required: true
  },
  name: String,
  phone: String,
  address: String,
  lat: Number,
  lng: Number,
  distance: Number
});

// Create models
export const SafetyAlert = mongoose.model<ISafetyAlert>('SafetyAlert', safetyAlertSchema);
export const TrustedCircle = mongoose.model<ITrustedCircle>('TrustedCircle', trustedCircleSchema);
export const SafetyCheckIn = mongoose.model<ISafetyCheckIn>('SafetyCheckIn', safetyCheckInSchema);
export const SafetyProfile = mongoose.model<ISafetyProfile>('SafetyProfile', safetyProfileSchema);
export const AreaSafety = mongoose.model<IAreaSafety>('AreaSafety', areaSafetySchema);
export const EmergencyContact = mongoose.model<IEmergencyContact>('EmergencyContact', emergencyContactSchema);
