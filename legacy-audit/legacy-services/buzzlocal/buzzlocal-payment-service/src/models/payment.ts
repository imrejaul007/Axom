import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, required: true, index: true },
    subscriptionId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'payments' }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ razorpayPaymentId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);