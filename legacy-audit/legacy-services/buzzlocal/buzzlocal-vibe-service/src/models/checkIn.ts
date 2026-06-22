import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckIn extends Document {
  vibeId: string;
  userId: string;
  note?: string;
  photoUrl?: string;
  createdAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    vibeId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    note: { type: String, maxlength: 500 },
    photoUrl: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'check_ins' }
);

CheckInSchema.index({ vibeId: 1, createdAt: -1 });
CheckInSchema.index({ userId: 1, createdAt: -1 });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);