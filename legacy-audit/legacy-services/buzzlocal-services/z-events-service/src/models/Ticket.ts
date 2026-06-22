import mongoose, { Schema, Document } from 'mongoose';

export type TicketStatus = 'reserved' | 'confirmed' | 'cancelled' | 'checked_in' | 'refunded';

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: string;
  quantity: number;
  totalAmount: number;

  // Ticket details
  ticketCode: string;
  qrCode: string;
  status: TicketStatus;

  // Check-in
  checkedInAt?: Date;
  checkedInBy?: string;

  // Payment
  paymentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';

  // Timestamps
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    quantity: { type: Number, default: 1 },
    totalAmount: { type: Number, default: 0 },

    ticketCode: { type: String, required: true, unique: true },
    qrCode: String,
    status: {
      type: String,
      enum: ['reserved', 'confirmed', 'cancelled', 'checked_in', 'refunded'],
      default: 'confirmed',
    },

    checkedInAt: Date,
    checkedInBy: String,

    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },

    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TicketSchema.index({ ticketCode: 1 }, { unique: true });
TicketSchema.index({ userId: 1, eventId: 1 });
TicketSchema.index({ qrCode: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
