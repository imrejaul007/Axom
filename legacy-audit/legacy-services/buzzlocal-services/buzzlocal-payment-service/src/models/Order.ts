import mongoose, { Schema, Document } from 'mongoose';

export type OrderType = 'event_ticket' | 'deal_purchase' | 'subscription';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  userId: string;

  // Order details
  type: OrderType;
  referenceId: string; // eventId, dealId, etc.
  referenceName: string;
  quantity: number;
  amount: number;
  currency: string;

  // Payment
  status: OrderStatus;
  paymentId?: string;
  paymentMethod?: string;
  paidAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;

  // Refund
  refundId?: string;
  refundedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['event_ticket', 'deal_purchase', 'subscription'],
      required: true,
    },
    referenceId: { type: String, required: true },
    referenceName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentId: String,
    paymentMethod: String,
    paidAt: Date,
    metadata: Schema.Types.Mixed,
    refundId: String,
    refundedAt: Date,
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ referenceId: 1, type: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
