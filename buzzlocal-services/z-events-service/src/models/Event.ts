import mongoose, { Schema, Document } from 'mongoose';

export type EventCategory =
  | 'music'
  | 'tech'
  | 'food'
  | 'sports'
  | 'arts'
  | 'networking'
  | 'wellness'
  | 'education'
  | 'gaming'
  | 'nightlife'
  | 'community'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface ILocation {
  latitude: number;
  longitude: number;
  address: string;
  area?: string;
  city?: string;
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  category: EventCategory;
  location: ILocation;
  startDate: Date;
  endDate?: Date;
  startTime: string;
  endTime?: string;

  // Organizer
  organizerId: string;
  organizerName: string;
  organizerVerified: boolean;

  // Ticketing
  isPaid: boolean;
  ticketPrice?: number;
  maxAttendees?: number;
  currentAttendees: number;

  // QR Code for check-in
  qrCode?: string;
  checkInOpen: boolean;

  // Engagement
  interestedCount: number;
  interestedUsers: string[];
  savedCount: number;

  // AI predictions
  predictedAttendance?: number;
  predictedPeakTime?: string;

  // Status
  status: EventStatus;

  // Geospatial
  locationGeo?: {
    type: 'Point';
    coordinates: [number, number];
  };

  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true, maxlength: 5000 },
    coverImage: String,
    category: {
      type: String,
      enum: ['music', 'tech', 'food', 'sports', 'arts', 'networking', 'wellness', 'education', 'gaming', 'nightlife', 'community', 'other'],
      required: true,
      index: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
      area: String,
      city: String,
    },
    startDate: { type: Date, required: true, index: true },
    endDate: Date,
    startTime: { type: String, required: true },
    endTime: String,

    organizerId: { type: String, required: true, index: true },
    organizerName: { type: String, required: true },
    organizerVerified: { type: Boolean, default: false },

    isPaid: { type: Boolean, default: false },
    ticketPrice: Number,
    maxAttendees: Number,
    currentAttendees: { type: Number, default: 0 },

    qrCode: String,
    checkInOpen: { type: Boolean, default: false },

    interestedCount: { type: Number, default: 0 },
    interestedUsers: [{ type: String }],
    savedCount: { type: Number, default: 0 },

    predictedAttendance: Number,
    predictedPeakTime: String,

    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'published',
      index: true,
    },

    locationGeo: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number],
    },
  },
  { timestamps: true }
);

// Indexes
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ 'locationGeo': '2dsphere' });
EventSchema.index({ startDate: 1, status: 1 });
EventSchema.index({ category: 1, startDate: 1 });

// Generate slug
EventSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    const slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    this.slug = `${slug}-${Date.now()}`;
  }
  if (this.location) {
    this.locationGeo = {
      type: 'Point',
      coordinates: [this.location.longitude, this.location.latitude],
    };
  }
  next();
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
