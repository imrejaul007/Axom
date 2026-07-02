import mongoose, { Document, Schema } from 'mongoose';

// Property Types
export type PropertyType = 'rental' | 'pg' | 'coliving' | 'apartment';
export type PropertyStatus = 'active' | 'booked' | 'unavailable';

// Flatmate Status
export type FlatmateStatus = 'active' | 'matched' | 'closed';

// Inquiry Status
export type InquiryStatus = 'pending' | 'contacted' | 'visited' | 'booked' | 'rejected';

// Property Interface
export interface IProperty extends Document {
  ownerId: string;
  type: PropertyType;
  title: string;
  description: string;
  address: {
    street: string;
    area: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  // Pricing
  monthlyRent: number;
  securityDeposit: number;
  maintenance: number;
  // Details
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  furnished: 'full' | 'semi' | 'unfurnished';
  availableFrom: Date;
  tenantType: 'family' | 'bachelor' | 'anyone';
  // PG specific
  foodIncluded?: boolean;
  foodType?: 'veg' | 'non-veg' | 'both';
  sharingType?: 'single' | 'double' | 'triple';
  // Co-living specific
  amenities?: string[];
  // Media
  images: string[];
  virtualTour?: string;
  // Stats
  views: number;
  inquiries: number;
  status: PropertyStatus;
  // Flags
  verified: boolean;
  featured: boolean;
  // For SocietyOS integration
  societyId?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Flatmate Listing Interface
export interface IFlatmateListing extends Document {
  userId: string;
  lookingFor: 'room' | ' roommate';
  budget: {
    min: number;
    max: number;
  };
  location: {
    areas: string[];
    city: string;
  };
  moveInDate: Date;
  duration: number; // months
  // Profile
  age: number;
  gender: 'male' | 'female' | 'other';
  occupation: string;
  bio: string;
  habits: {
    smoking: boolean;
    drinking: 'never' | 'occasionally' | 'often';
    pets: boolean;
    lateNight: boolean;
  };
  preferences: {
    gender: 'male' | 'female' | 'no-preference';
    smoking: boolean;
    pets: boolean;
    vegetarian: boolean;
  };
  // Matching
  interests: string[];
  compatibilityScore?: number;
  status: FlatmateStatus;
  matchedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Property Inquiry Interface
export interface IPropertyInquiry extends Document {
  propertyId: string;
  seekerId: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  visitDate?: Date;
  status: InquiryStatus;
  ownerResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Property Review Interface
export interface IPropertyReview extends Document {
  propertyId: string;
  userId: string;
  rating: number; // 1-5
  title: string;
  review: string;
  photos?: string[];
  maintenanceRating?: number;
  locationRating?: number;
  amenitiesRating?: number;
  createdAt: Date;
}

// Mongoose Schemas
const addressSchema = new Schema({
  street: String,
  area: String,
  city: String,
  pincode: String,
  landmark: String
}, { _id: false });

const locationSchema = new Schema({
  lat: Number,
  lng: Number
}, { _id: false });

const budgetSchema = new Schema({
  min: Number,
  max: Number
}, { _id: false });

const habitsSchema = new Schema({
  smoking: Boolean,
  drinking: { type: String, enum: ['never', 'occasionally', 'often'] },
  pets: Boolean,
  lateNight: Boolean
}, { _id: false });

const preferencesSchema = new Schema({
  gender: { type: String, enum: ['male', 'female', 'no-preference'] },
  smoking: Boolean,
  pets: Boolean,
  vegetarian: Boolean
}, { _id: false });

const propertySchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  type: { type: String, enum: ['rental', 'pg', 'coliving', 'apartment'], required: true },
  title: { type: String, required: true },
  description: String,
  address: { type: addressSchema, required: true },
  location: { type: locationSchema, required: true },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, required: true },
  maintenance: { type: Number, default: 0 },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  balconies: { type: Number, default: 0 },
  furnished: { type: String, enum: ['full', 'semi', 'unfurnished'], default: 'unfurnished' },
  availableFrom: { type: Date, required: true },
  tenantType: { type: String, enum: ['family', 'bachelor', 'anyone'], default: 'anyone' },
  foodIncluded: Boolean,
  foodType: String,
  sharingType: String,
  amenities: [String],
  images: [String],
  virtualTour: String,
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'booked', 'unavailable'], default: 'active' },
  verified: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  societyId: String
}, { timestamps: true });

const flatmateSchema = new Schema({
  userId: { type: String, required: true, index: true },
  lookingFor: { type: String, enum: ['room', 'roommate'], required: true },
  budget: { type: budgetSchema, required: true },
  location: {
    areas: [String],
    city: String
  },
  moveInDate: Date,
  duration: Number,
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  occupation: String,
  bio: String,
  habits: { type: habitsSchema },
  preferences: { type: preferencesSchema },
  interests: [String],
  compatibilityScore: Number,
  status: { type: String, enum: ['active', 'matched', 'closed'], default: 'active' },
  matchedWith: [String]
}, { timestamps: true });

const inquirySchema = new Schema({
  propertyId: { type: String, required: true, index: true },
  seekerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  message: String,
  visitDate: Date,
  status: { type: String, enum: ['pending', 'contacted', 'visited', 'booked', 'rejected'], default: 'pending' },
  ownerResponse: String
}, { timestamps: true });

const reviewSchema = new Schema({
  propertyId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  review: String,
  photos: [String],
  maintenanceRating: Number,
  locationRating: Number,
  amenitiesRating: Number
}, { timestamps: true });

// Indexes
propertySchema.index({ 'address.area': 1 });
propertySchema.index({ 'address.city': 1 });
propertySchema.index({ monthlyRent: 1 });
propertySchema.index({ type: 1, status: 1 });
propertySchema.index({ location: '2dsphere' });

flatmateSchema.index({ status: 1, gender: 1 });
flatmateSchema.index({ 'budget.min': 1, 'budget.max': 1 });

// Export models
export const Property = mongoose.model<IProperty>('Property', propertySchema);
export const FlatmateListing = mongoose.model<IFlatmateListing>('FlatmateListing', flatmateSchema);
export const PropertyInquiry = mongoose.model<IPropertyInquiry>('PropertyInquiry', inquirySchema);
export const PropertyReview = mongoose.model<IPropertyReview>('PropertyReview', reviewSchema);
