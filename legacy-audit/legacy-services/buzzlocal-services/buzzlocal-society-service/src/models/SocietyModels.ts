import mongoose, { Document, Schema } from 'mongoose';

// Society Types
export type SocietyType = 'apartment' | 'gated' | 'layout' | 'campus' | 'society';

// Member Roles
export type MemberRole = 'resident' | 'secretary' | 'admin' | 'security';

// Announcement Priority
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

// Maintenance Status
export type MaintenanceStatus = 'pending' | 'in_progress' | 'resolved';

// Visitor Status
export type VisitorStatus = 'pending' | 'approved' | 'rejected' | 'arrived' | 'left';

// Society
export interface ISociety extends Document {
  name: string;
  type: SocietyType;
  address: {
    street: string;
    area: string;
    city: string;
    pincode: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  adminIds: string[];
  memberCount: number;
  activeMembers: number;
  facilities: {
    name: string;
    description: string;
    capacity: number;
    available: boolean;
    slots?: {
      start: string;
      end: string;
      bookedBy?: string;
      date: Date;
    }[];
  }[];
  settings: {
    requireApproval: boolean;
    allowClassifieds: boolean;
    allowEvents: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Society Member
export interface ISocietyMember extends Document {
  societyId: string;
  userId: string;
  role: MemberRole;
  flat?: string;
  wing?: string;
  joinedAt: Date;
  isActive: boolean;
}

// Announcement
export interface IAnnouncement extends Document {
  societyId: string;
  authorId: string;
  authorRole: MemberRole;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  attachments?: string[];
  isPinned: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Maintenance Request
export interface IMaintenanceRequest extends Document {
  societyId: string;
  requesterId: string;
  category: 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'common_area' | 'other';
  title: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  status: MaintenanceStatus;
  assignedTo?: string;
  images?: string[];
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Visitor
export interface IVisitor extends Document {
  societyId: string;
  hostId: string;
  visitorName: string;
  visitorPhone: string;
  purpose: 'family' | 'friend' | 'delivery' | 'service' | 'other';
  expectedDate: Date;
  expectedTime?: string;
  flatNumber: string;
  status: VisitorStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  gateNumber?: string;
  notes?: string;
  createdAt: Date;
}

// Classified (Buy/Sell within society)
export interface IClassified extends Document {
  societyId: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  negotiable: boolean;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: string[];
  status: 'active' | 'sold' | 'reserved';
  interestedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Society Event
export interface ISocietyEvent extends Document {
  societyId: string;
  organizerId: string;
  title: string;
  description: string;
  date: Date;
  time?: string;
  venue: string;
  maxAttendees?: number;
  attendees: string[];
  isPublic: boolean;
  createdAt: Date;
}

// Domestic Help
export interface IDomesticHelp extends Document {
  societyId: string;
  userId: string;
  name: string;
  phone: string;
  profession: 'maid' | 'cook' | 'driver' | 'gardener' | 'security' | 'other';
  available: boolean;
  rating: number;
  reviews: {
    userId: string;
    rating: number;
    comment: string;
    date: Date;
  }[];
  createdAt: Date;
}

// Schemas
const locationSchema = new Schema({
  lat: Number,
  lng: Number
}, { _id: false });

const addressSchema = new Schema({
  street: String,
  area: String,
  city: String,
  pincode: String
}, { _id: false });

const facilitySchema = new Schema({
  name: { type: String, required: true },
  description: String,
  capacity: { type: Number, default: 1 },
  available: { type: Boolean, default: true },
  slots: [{
    start: String,
    end: String,
    bookedBy: String,
    date: Date
  }]
}, { _id: false });

const societySchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['apartment', 'gated', 'layout', 'campus', 'society'], required: true },
  address: { type: addressSchema, required: true },
  location: { type: locationSchema, required: true },
  adminIds: [{ type: String }],
  memberCount: { type: Number, default: 0 },
  activeMembers: { type: Number, default: 0 },
  facilities: [facilitySchema],
  settings: {
    requireApproval: { type: Boolean, default: true },
    allowClassifieds: { type: Boolean, default: true },
    allowEvents: { type: Boolean, default: true }
  }
}, { timestamps: true });

const memberSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['resident', 'secretary', 'admin', 'security'], default: 'resident' },
  flat: String,
  wing: String,
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const announcementSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  authorRole: { type: String, enum: ['resident', 'secretary', 'admin', 'security'] },
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
  attachments: [{ type: String }],
  isPinned: { type: Boolean, default: false },
  expiresAt: Date
}, { timestamps: true });

const maintenanceSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  requesterId: { type: String, required: true },
  category: { type: String, enum: ['plumbing', 'electrical', 'cleaning', 'security', 'common_area', 'other'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  assignedTo: String,
  images: [{ type: String }],
  resolution: String,
  resolvedAt: Date
}, { timestamps: true });

const visitorSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  hostId: { type: String, required: true },
  visitorName: { type: String, required: true },
  visitorPhone: String,
  purpose: { type: String, enum: ['family', 'friend', 'delivery', 'service', 'other'] },
  expectedDate: { type: Date, required: true },
  expectedTime: String,
  flatNumber: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'arrived', 'left'], default: 'pending' },
  checkInTime: Date,
  checkOutTime: Date,
  gateNumber: String,
  notes: String
}, { timestamps: true });

const classifiedSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  sellerId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  negotiable: { type: Boolean, default: true },
  condition: { type: String, enum: ['new', 'like_new', 'good', 'fair'] },
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'sold', 'reserved'], default: 'active' },
  interestedUsers: [{ type: String }]
}, { timestamps: true });

const eventSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  organizerId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  time: String,
  venue: String,
  maxAttendees: Number,
  attendees: [{ type: String }],
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

const domesticHelpSchema = new Schema({
  societyId: { type: String, required: true, index: true },
  userId: String,
  name: { type: String, required: true },
  phone: { type: String, required: true },
  profession: { type: String, enum: ['maid', 'cook', 'driver', 'gardener', 'security', 'other'] },
  available: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviews: [{
    userId: String,
    rating: Number,
    comment: String,
    date: Date
  }]
}, { timestamps: true });

// Models
export const Society = mongoose.model<ISociety>('Society', societySchema);
export const SocietyMember = mongoose.model<ISocietyMember>('SocietyMember', memberSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const MaintenanceRequest = mongoose.model<IMaintenanceRequest>('MaintenanceRequest', maintenanceSchema);
export const Visitor = mongoose.model<IVisitor>('Visitor', visitorSchema);
export const Classified = mongoose.model<IClassified>('Classified', classifiedSchema);
export const SocietyEvent = mongoose.model<ISocietyEvent>('SocietyEvent', eventSchema);
export const DomesticHelp = mongoose.model<IDomesticHelp>('DomesticHelp', domesticHelpSchema);
