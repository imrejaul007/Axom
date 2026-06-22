import mongoose, { Schema, Document } from 'mongoose';

export type PostType = 'general' | 'event' | 'alert' | 'place' | 'deal' | 'poll';
export type AlertCategory = 'traffic' | 'weather' | 'safety' | 'construction' | 'event' | 'utilities' | 'other';
export type AlertSeverity = 'low' | 'medium' | 'high';

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  city?: string;
}

export interface IMedia {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface IPollOption {
  text: string;
  votes: number;
  voterIds: string[];
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  type: PostType;
  authorId: string;
  content: string;
  media?: IMedia[];
  location?: ILocation;
  tags: string[];
  coinReward: number;

  // Engagement
  likes: string[]; // User IDs who liked
  comments: number;
  saves: string[]; // User IDs who saved
  shares: number;

  // Event specific
  eventDate?: Date;
  eventTime?: string;

  // Alert specific
  alertCategory?: AlertCategory;
  alertSeverity?: AlertSeverity;

  // Deal specific
  dealDiscount?: number;
  dealExpiry?: Date;

  // Poll specific
  pollOptions?: IPollOption[];
  pollEndsAt?: Date;

  // Location search index
  locationGeo?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  // Status
  isActive: boolean;
  isDeleted: boolean;
  moderatedAt?: Date;
  moderatedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  thumbnailUrl: String,
  width: Number,
  height: Number,
}, { _id: false });

const PollOptionSchema = new Schema<IPollOption>({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voterIds: [{ type: String }],
}, { _id: true });

const PostSchema = new Schema<IPost>(
  {
    type: {
      type: String,
      enum: ['general', 'event', 'alert', 'place', 'deal', 'poll'],
      required: true,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    media: [MediaSchema],
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: String,
      area: String,
      city: String,
    },
    tags: [{
      type: String,
      index: true,
    }],
    coinReward: {
      type: Number,
      default: 20,
    },

    // Engagement
    likes: [{ type: String }],
    comments: { type: Number, default: 0 },
    saves: [{ type: String }],
    shares: { type: Number, default: 0 },

    // Event
    eventDate: Date,
    eventTime: String,

    // Alert
    alertCategory: {
      type: String,
      enum: ['traffic', 'weather', 'safety', 'construction', 'event', 'utilities', 'other'],
    },
    alertSeverity: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },

    // Deal
    dealDiscount: Number,
    dealExpiry: Date,

    // Poll
    pollOptions: [PollOptionSchema],
    pollEndsAt: Date,

    // Geo index for location-based queries
    locationGeo: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },

    // Status
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false },
    moderatedAt: Date,
    moderatedBy: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
PostSchema.index({ locationGeo: '2dsphere' });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'tags': 1, 'createdAt': -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ type: 1, createdAt: -1 });

// Pre-save hook to set geo coordinates
PostSchema.pre('save', function (next) {
  if (this.location) {
    this.locationGeo = {
      type: 'Point',
      coordinates: [this.location.longitude, this.location.latitude],
    };
  }
  next();
});

export const Post = mongoose.model<IPost>('Post', PostSchema);
