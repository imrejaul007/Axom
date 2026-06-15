import mongoose, { Schema, Document } from 'mongoose';

export interface IRSVP extends Document {
  eventId: string;
  userId: string;
  status: 'going' | 'maybe' | 'not_going';
  createdAt: Date;
}

const RSVPSchema = new Schema<IRSVP>(
  {
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    status: { type: String, enum: ['going', 'maybe', 'not_going'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'rsvps' }
);

RSVPSchema.index({ eventId: 1, userId: 1 }, { unique: true });
RSVPSchema.index({ eventId: 1, status: 1 });

export const RSVP = mongoose.model<IRSVPSchema>('RSVP', RSVPSchema);