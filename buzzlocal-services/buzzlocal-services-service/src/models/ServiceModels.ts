import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceProvider extends Document {
  userId: string;
  name: string;
  category: string;
  profession: string;
  description: string;
  phone: string;
  whatsapp?: string;
  areas: string[];
  rating: number;
  reviewCount: number;
  priceRange: { min: number; max: number };
  availability: 'available' | 'busy' | 'unavailable';
  verified: boolean;
  images: string[];
  services: string[];
  workingHours: { day: string; start: string; end: string }[];
  createdAt: Date;
}

export interface IServiceBooking extends Document {
  providerId: string;
  customerId: string;
  service: string;
  date: Date;
  time: string;
  address: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
  createdAt: Date;
}

export interface IServiceReview extends Document {
  providerId: string;
  customerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
}

const serviceProviderSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  profession: String,
  description: String,
  phone: { type: String, required: true },
  whatsapp: String,
  areas: [String],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  priceRange: { min: Number, max: Number },
  availability: { type: String, enum: ['available', 'busy', 'unavailable'], default: 'available' },
  verified: { type: Boolean, default: false },
  images: [String],
  services: [String],
  workingHours: [{
    day: String,
    start: String,
    end: String
  }]
}, { timestamps: true });

serviceProviderSchema.index({ category: 1, availability: 1 });
serviceProviderSchema.index({ rating: -1 });

const bookingSchema = new Schema({
  providerId: { type: String, required: true, index: true },
  customerId: { type: String, required: true },
  service: String,
  date: Date,
  time: String,
  address: String,
  phone: String,
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  price: Number,
  notes: String
}, { timestamps: true });

const reviewSchema = new Schema({
  providerId: { type: String, required: true, index: true },
  customerId: String,
  bookingId: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  images: [String]
}, { timestamps: true });

export const ServiceProvider = mongoose.model<IServiceProvider>('ServiceProvider', serviceProviderSchema);
export const ServiceBooking = mongoose.model<IServiceBooking>('ServiceBooking', bookingSchema);
export const ServiceReview = mongoose.model<IServiceReview>('ServiceReview', reviewSchema);

export const CATEGORIES = [
  { id: 'plumber', label: 'Plumber', icon: 'water' },
  { id: 'electrician', label: 'Electrician', icon: 'flash' },
  { id: 'carpenter', label: 'Carpenter', icon: 'hammer' },
  { id: 'painter', label: 'Painter', icon: 'brush' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles' },
  { id: 'salon', label: 'Salon & Beauty', icon: 'cut' },
  { id: 'fitness', label: 'Fitness Trainer', icon: 'fitness' },
  { id: 'tutor', label: 'Tutor', icon: 'school' },
  { id: 'photographer', label: 'Photographer', icon: 'camera' },
  { id: 'freelancer', label: 'Freelancer', icon: 'briefcase' }
];
