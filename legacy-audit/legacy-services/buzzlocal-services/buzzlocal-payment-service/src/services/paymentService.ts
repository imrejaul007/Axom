import { Order, IOrder, OrderType } from '../models/Order.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import crypto from 'crypto';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

interface CreateOrderData {
  userId: string;
  type: OrderType;
  referenceId: string;
  referenceName: string;
  quantity: number;
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

interface PaymentVerification {
  orderId: string;
  paymentId: string;
  signature: string;
}

export class PaymentService {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<{
    order: IOrder;
    razorpayOrder?;
  }> {
    const orderId = `BL_${uuidv4().substring(0, 8).toUpperCase()}`;

    const order = new Order({
      orderId,
      userId: data.userId,
      type: data.type,
      referenceId: data.referenceId,
      referenceName: data.referenceName,
      quantity: data.quantity,
      amount: data.amount,
      currency: data.currency || 'INR',
      status: 'pending',
      metadata: data.metadata,
    });

    // Create Razorpay order if amount > 0
    let razorpayOrder = null;
    if (data.amount > 0) {
      try {
        razorpayOrder = await this.createRazorpayOrder({
          amount: data.amount * 100, // Razorpay uses paise
          currency: data.currency || 'INR',
          receipt: orderId,
          notes: {
            userId: data.userId,
            type: data.type,
            referenceId: data.referenceId,
          },
        });
      } catch (error) {
        console.error('Razorpay order creation failed:', error);
      }
    }

    await order.save();

    return { order, razorpayOrder };
  }

  /**
   * Create Razorpay order
   */
  private async createRazorpayOrder(data: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  }): Promise<unknown> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const response = await axios.post(
      `${RAZORPAY_BASE_URL}/orders`,
      data,
      {
        auth: {
          username: keyId,
          password: keySecret,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(data: PaymentVerification): Promise<boolean> {
    const { orderId, paymentId, signature } = data;

    // Find order
    const order = await Order.findOne({ orderId });
    if (!order) {
      throw new Error('Order not found');
    }

    // Generate expected signature
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(payload)
      .digest('hex');

    // Verify signature
    const isValid = signature === expectedSignature;

    if (isValid) {
      // Update order status
      order.status = 'paid';
      order.paymentId = paymentId;
      order.paidAt = new Date();
      await order.save();

      // Trigger post-payment actions
      await this.handlePaymentSuccess(order);
    }

    return isValid;
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(order: IOrder): Promise<void> {
    // Send notification
    try {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011'}/notifications/send`,
        {
          userId: order.userId,
          title: 'Payment Successful! 🎉',
          body: `Your ${order.referenceName} order is confirmed`,
          data: {
            orderId: order.orderId,
            type: order.type,
          },
          type: 'reward',
        }
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    // Track analytics
    try {
      await axios.post(
        `${process.env.MIND_SERVICE_URL || 'http://localhost:4005'}/events`,
        {
          eventType: 'payment_completed',
          source: 'buzzlocal_payments',
          properties: {
            orderId: order.orderId,
            type: order.type,
            amount: order.amount,
          },
        }
      );
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: unknown[]; page: number; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o._id.toString(),
        orderId: o.orderId,
        type: o.type,
        referenceName: o.referenceName,
        quantity: o.quantity,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
      })),
      page,
      total,
    };
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<IOrder | null> {
    return Order.findOne({ orderId }).lean();
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Cannot cancel non-pending order');
    }

    order.status = 'cancelled';
    await order.save();

    return order;
  }

  /**
   * Request refund
   */
  async requestRefund(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'paid') {
      throw new Error('Cannot refund non-paid order');
    }

    // Initiate refund with Razorpay
    if (order.paymentId && order.amount > 0) {
      try {
        const refund = await this.initiateRazorpayRefund(order.paymentId, order.amount);
        order.refundId = refund.id;
      } catch (error) {
        console.error('Refund initiation failed:', error);
      }
    }

    order.status = 'refunded';
    order.refundedAt = new Date();
    await order.save();

    return order;
  }

  /**
   * Initiate Razorpay refund
   */
  private async initiateRazorpayRefund(paymentId: string, amount: number): Promise<unknown> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const response = await axios.post(
      `${RAZORPAY_BASE_URL}/payments/${paymentId}/refund`,
      { amount: amount * 100 }, // paise
      {
        auth: {
          username: keyId,
          password: keySecret,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Handle webhook
   */
  async handleWebhook(event): Promise<void> {
    const { event: eventType, payload } = event;

    switch (eventType) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload.payment.entity);
        break;
      case 'refund.created':
        await this.handleRefundCreated(payload.refund.entity);
        break;
      default:
        console.log('Unhandled webhook event:', eventType);
    }
  }

  private async handlePaymentCaptured(payment): Promise<void> {
    const order = await Order.findOne({ paymentId: payment.id });
    if (order && order.status === 'pending') {
      order.status = 'paid';
      order.paidAt = new Date();
      order.paymentMethod = payment.method;
      await order.save();
      await this.handlePaymentSuccess(order);
    }
  }

  private async handlePaymentFailed(payment): Promise<void> {
    const order = await Order.findOne({ paymentId: payment.id });
    if (order) {
      order.status = 'failed';
      await order.save();
    }
  }

  private async handleRefundCreated(refund): Promise<void> {
    const order = await Order.findOne({ paymentId: refund.payment_id });
    if (order) {
      order.status = 'refunded';
      order.refundId = refund.id;
      order.refundedAt = new Date();
      await order.save();
    }
  }
}

export const paymentService = new PaymentService();
