import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  eventId: string;
  userId: string;
  ticketNumber: string;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  purchasedAt: Date;
  checkedInAt?: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    ticketNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ['valid', 'used', 'cancelled', 'refunded'], default: 'valid' },
    purchasedAt: { type: Date, default: Date.now },
    checkedInAt: { type: Date },
  },
  { timestamps: false, collection: 'tickets' }
);

TicketSchema.index({ eventId: 1, userId: 1 });
TicketSchema.index({ ticketNumber: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);