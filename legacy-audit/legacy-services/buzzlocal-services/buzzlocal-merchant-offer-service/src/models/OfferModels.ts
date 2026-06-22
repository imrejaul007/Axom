import mongoose, { Document, Schema } from 'mongoose';

export interface IMerchantOffer extends Document {
  merchantId: string;
  merchantName: string;
  type: 'flash_sale' | 'happy_hour' | 'location_trigger' | 'event_link' | 'crowd_deal';
  title: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed' | 'buy_one_get_one';
  originalPrice?: number;
  validFrom: Date;
  validUntil: Date;
  location: { lat: number; lng: number; address: string; area: string };
  triggerConditions?: { crowdLevel?: number; weather?: string[]; timeOfDay?: string[] };
  status: 'active' | 'paused' | 'expired';
  currentClaimants: number;
  maxClaimants?: number;
  crowdLevel?: string;
  crowdWait?: string;
  createdAt: Date;
}

const merchantOfferSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  merchantName: String,
  type: { type: String, enum: ['flash_sale', 'happy_hour', 'location_trigger', 'event_link', 'crowd_deal'], required: true },
  title: { type: String, required: true },
  description: String,
  discount: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed', 'buy_one_get_one'], default: 'percentage' },
  originalPrice: Number,
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  location: { lat: Number, lng: Number, address: String, area: String },
  triggerConditions: {
    crowdLevel: Number,
    weather: [String],
    timeOfDay: [String]
  },
  status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active', index: true },
  currentClaimants: { type: Number, default: 0 },
  maxClaimants: Number,
  crowdLevel: String,
  crowdWait: String
}, { timestamps: true });

merchantOfferSchema.index({ status: 1, validUntil: 1 });
merchantOfferSchema.index({ 'location.area': 1 });

export const MerchantOffer = mongoose.model<IMerchantOffer>('MerchantOffer', merchantOfferSchema);
