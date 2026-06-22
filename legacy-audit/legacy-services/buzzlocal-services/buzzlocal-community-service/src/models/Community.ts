import mongoose, { Schema, Document } from 'mongoose';

export type CommunityType = 'area' | 'interest' | 'apartment' | 'campus';

export interface ICommunity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  type: CommunityType;
  description: string;
  coverImage?: string;
  icon?: string;
  memberCount: number;
  memberIds: string[];
  creatorId: string;
  admins: string[];
  location?: {
    latitude: number;
    longitude: number;
    area?: string;
  };
  rules?: string[];
  isPrivate: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['area', 'interest', 'apartment', 'campus'],
      required: true,
      index: true,
    },
    description: { type: String, maxlength: 500 },
    coverImage: String,
    icon: String,
    memberCount: { type: Number, default: 0 },
    memberIds: [{ type: String }],
    creatorId: { type: String, required: true },
    admins: [{ type: String }],
    location: {
      latitude: Number,
      longitude: Number,
      area: String,
    },
    rules: [String],
    isPrivate: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
CommunitySchema.index({ slug: 1 }, { unique: true });
CommunitySchema.index({ type: 1, 'location.area': 1 });
CommunitySchema.index({ memberIds: 1 });

// Generate slug from name
CommunitySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  this.memberCount = this.memberIds.length;
  next();
});

export const Community = mongoose.model<ICommunity>('Community', CommunitySchema);
