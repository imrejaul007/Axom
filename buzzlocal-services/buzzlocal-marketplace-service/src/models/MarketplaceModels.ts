import mongoose, { Document, Schema } from 'mongoose';

export interface IListing extends Document {
  id: string;
  sellerId: string;
  sellerTrustScore: number;
  sellerTrustLevel: string;
  category: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: string[];
  location: {
    lat: number;
    lng: number;
    area: string;
    showExact: boolean;
  };
  status: 'active' | 'sold' | 'reserved';
  views: number;
  interestedCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema({
  sellerId: { type: String, required: true, index: true },
  sellerTrustScore: { type: Number, default: 0 },
  sellerTrustLevel: { type: String, default: 'new' },
  category: { type: String, required: true },
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
  status: { type: String, enum: ['active', 'sold', 'reserved'], default: 'active' },
  views: { type: Number, default: 0 },
  interestedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ 'location.area': 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ sellerId: 1 });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
