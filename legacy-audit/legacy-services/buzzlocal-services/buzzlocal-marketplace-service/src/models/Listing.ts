import mongoose, { Document, Schema } from 'mongoose';

export interface IListing extends Document {
  sellerId: string;
  sellerTrustScore: number;
  sellerTrustLevel: string;
  sellerName: string;
  category: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: string[];
  location: { lat: number; lng: number; area: string; showExact: boolean };
  status: 'active' | 'sold' | 'reserved';
  views: number;
  interestedCount: number;
  expiresAt: Date;
  createdAt: Date;
}

const listingSchema = new Schema({
  sellerId: { type: String, required: true, index: true },
  sellerTrustScore: { type: Number, default: 0 },
  sellerTrustLevel: { type: String, default: 'new' },
  sellerName: { type: String },
  category: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  negotiable: { type: Boolean, default: true },
  condition: { type: String, enum: ['new', 'like_new', 'good', 'fair'] },
  images: [{ type: String }],
  location: {
    lat: Number,
    lng: Number,
    area: String,
    showExact: Boolean
  },
  status: { type: String, enum: ['active', 'sold', 'reserved'], default: 'active', index: true },
  views: { type: Number, default: 0 },
  interestedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

listingSchema.index({ status: 1, category: 1 });
listingSchema.index({ 'location.area': 1 });
listingSchema.index({ price: 1 });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);

export const CATEGORIES = [
  'furniture', 'electronics', 'housing', 'vehicles', 'books', 'fashion', 'services', 'tickets', 'kids', 'other'
];
