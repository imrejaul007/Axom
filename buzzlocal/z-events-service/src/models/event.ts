import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  organizerId: string;
  location: { type: string; coordinates: [number, number]; address: string };
  startDate: Date;
  endDate: Date;
  coverImage?: string;
  category: 'music' | 'sports' | 'food' | 'tech' | 'art' | 'community' | 'other';
  isPublic: boolean;
  capacity: number;
  ticketPrice: number;
  ticketsSold: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    organizerId: { type: String, required: true, index: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String, required: true },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    coverImage: { type: String },
    category: { type: String, enum: ['music', 'sports', 'food', 'tech', 'art', 'community', 'other'], required: true },
    isPublic: { type: Boolean, default: true },
    capacity: { type: Number, required: true, min: 1 },
    ticketPrice: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'events' }
);

EventSchema.index({ location: '2dsphere' });
EventSchema.index({ organizerId: 1, startDate: -1 });
EventSchema.index({ category: 1, startDate: -1 });
EventSchema.index({ startDate: -1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);