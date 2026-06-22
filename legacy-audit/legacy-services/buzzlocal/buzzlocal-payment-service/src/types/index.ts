import { z } from 'zod';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  paidAt?: Date;
  createdAt: Date;
}

export const CreateSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

export const CancelSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  dependencies: { mongodb: 'connected' | 'disconnected'; redis: 'connected' | 'disconnected' };
}