import mongoose, { Schema, Document } from 'mongoose';

export interface IVibe extends Document {
  name: string;
  type: 'cafe' | 'restaurant' | 'park' | 'beach' | 'gym' | 'coworking' | 'other';
  location: { type: string; coordinates: [number, number] };
  address?: string;
  checkInCount: number;
  trending: boolean;
  createdAt: Date;
}

const VibeSchema = new Schema<IVibe>(
  {
    name: { type: String, required: true, maxlength: 100 },
    type: { type: String, enum: ['cafe', 'restaurant', 'park', 'beach', 'gym', 'coworking', 'other'], required: true },
    location: { type: { type: String, default: 'Point' }, coordinates: { type: [Number], required: true } },
    address: { type: String },
    checkInCount: { type: Number, default: 0 },
    trending: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'vibes' }
);

VibeSchema.index({ location: '2dsphere' });
VibeSchema.index({ type: 1, trending: -1 });
VibeSchema.index({ checkInCount: -1 });

export const Vibe = mongoose.model<IVibe>('Vibe', VibeSchema);