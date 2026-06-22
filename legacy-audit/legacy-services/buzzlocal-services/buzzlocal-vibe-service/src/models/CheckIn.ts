import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckIn extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    area?: string;
  };
  placeId?: string;
  placeName?: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number; // minutes
  source: 'qr' | 'manual' | 'auto';
  createdAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    userId: { type: String, required: true, index: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      area: String,
    },
    placeId: String,
    placeName: String,
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: Date,
    duration: Number,
    source: { type: String, enum: ['qr', 'manual', 'auto'], default: 'manual' },
  },
  { timestamps: true }
);

// Indexes
CheckInSchema.index({ userId: 1, checkInTime: -1 });
CheckInSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
CheckInSchema.index({ checkInTime: -1 });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
