import { Router, Response } from 'express';
import { paymentService } from '../services/paymentService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * POST /payments/orders
 * Create a new order
 */
router.post('/orders', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { type, referenceId, referenceName, quantity, amount, currency, metadata } = req.body;

    if (!type || !referenceId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await paymentService.createOrder({
      userId: req.userId!,
      type,
      referenceId,
      referenceName: referenceName || 'Order',
      quantity: quantity || 1,
      amount,
      currency,
      metadata,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

/**
 * POST /payments/verify
 * Verify payment signature
 */
router.post('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isValid = await paymentService.verifyPayment({ orderId, paymentId, signature });

    res.json({ success: isValid });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

/**
 * GET /payments/orders
 * Get user's orders
 */
router.get('/orders', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = await paymentService.getUserOrders(
      req.userId!,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /payments/orders/:orderId
 * Get order details
 */
router.get('/orders/:orderId', async (req: AuthRequest, res: Response) => {
  try {
    const order = await paymentService.getOrder(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /payments/orders/:orderId/cancel
 * Cancel order
 */
router.post('/orders/:orderId/cancel', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const order = await paymentService.cancelOrder(req.params.orderId, req.userId!);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel order' });
  }
});

/**
 * POST /payments/orders/:orderId/refund
 * Request refund
 */
router.post('/orders/:orderId/refund', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const order = await paymentService.requestRefund(req.params.orderId, req.userId!);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Refund order error:', error);
    res.status(400).json({ error: error.message || 'Failed to request refund' });
  }
});

/**
 * POST /payments/webhook
 * Handle Razorpay webhook
 */
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    await paymentService.handleWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
