import mongoose, { Document, Schema } from 'mongoose';

export interface ICrisisIncident extends Document {
  type: 'flood' | 'fire' | 'earthquake' | 'storm' | 'other';
  severity: 'moderate' | 'severe' | 'critical';
  location: { lat: number; lng: number; affectedArea: string };
  description: string;
  sources: string[];
  status: 'active' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ISOSAlert extends Document {
  userId: string;
  location: { lat: number; lng: number; area: string };
  type: 'panic' | 'medical' | 'fire' | 'other';
  status: 'active' | 'responded' | 'resolved';
  contactsNotified: number;
  triggeredAt: Date;
}

export interface IShelter extends Document {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  capacity: number;
  currentOccupancy: number;
  contact: string;
  isActive: boolean;
}

export interface IResource extends Document {
  type: 'medicine' | 'food' | 'water' | 'transport' | 'other';
  name: string;
  location: { lat: number; lng: number; area: string };
  available: boolean;
  quantity?: number;
  contact: string;
}

const crisisSchema = new Schema({
  type: { type: String, enum: ['flood', 'fire', 'earthquake', 'storm', 'other'], required: true },
  severity: { type: String, enum: ['moderate', 'severe', 'critical'], default: 'moderate' },
  location: { lat: Number, lng: Number, affectedArea: String },
  description: String,
  sources: [String],
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  resolvedAt: Date
}, { timestamps: true });

const sosSchema = new Schema({
  userId: String,
  location: { lat: Number, lng: Number, area: String },
  type: { type: String, enum: ['panic', 'medical', 'fire', 'other'], default: 'panic' },
  status: { type: String, enum: ['active', 'responded', 'resolved'], default: 'active' },
  contactsNotified: { type: Number, default: 0 },
  triggeredAt: { type: Date, default: Date.now }
});

const shelterSchema = new Schema({
  name: String,
  address: String,
  location: { lat: Number, lng: Number },
  capacity: Number,
  currentOccupancy: { type: Number, default: 0 },
  contact: String,
  isActive: { type: Boolean, default: true }
});

const resourceSchema = new Schema({
  type: { type: String, enum: ['medicine', 'food', 'water', 'transport', 'other'] },
  name: String,
  location: { lat: Number, lng: Number, area: String },
  available: { type: Boolean, default: true },
  quantity: Number,
  contact: String
});

export const CrisisIncident = mongoose.model<ICrisisIncident>('CrisisIncident', crisisSchema);
export const SOSAlert = mongoose.model<ISOSAlert>('SOSAlert', sosSchema);
export const Shelter = mongoose.model<IShelter>('Shelter', shelterSchema);
export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
