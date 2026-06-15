import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { logger } from '../utils/logger.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

// Create subscription
router.post('/subscriptions', asyncHandler(async (req: Request, res: Response) => {
  const { userId, plan } = req.body;
  if (!userId || !plan) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId and plan are required' } }); }
  try {
    const subscription = await paymentService.createSubscription(userId, plan);
    return res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message } });
  }
}));

// Get subscription
router.get('/subscriptions/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const subscription = await paymentService.getSubscription(userId);
  if (!subscription) { return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No active subscription found' } }); }
  return res.json({ success: true, data: subscription });
}));

// Cancel subscription
router.delete('/subscriptions/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const subscription = await paymentService.cancelSubscription(userId, reason);
  return res.json({ success: true, data: subscription });
}));

// Get subscription features
router.get('/features/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const features = await paymentService.getSubscriptionFeatures(userId);
  return res.json({ success: true, data: { features } });
}));

// Get payment history
router.get('/payments/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = '20', offset = '0' } = req.query;
  const result = await paymentService.getPaymentHistory(userId, parseInt(limit as string, 10), parseInt(offset as string, 10));
  return res.json({ success: true, data: { items: result.payments, total: result.total } });
}));

// Confirm payment (webhook)
router.post('/payments/confirm', asyncHandler(async (req: Request, res: Response) => {
  const { paymentId, razorpayPaymentId } = req.body;
  if (!paymentId || !razorpayPaymentId) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'paymentId and razorpayPaymentId are required' } }); }
  const payment = await paymentService.confirmPayment(paymentId, razorpayPaymentId);
  return res.json({ success: true, data: payment });
}));

// Refund payment
router.post('/payments/:paymentId/refund', asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const payment = await paymentService.refundPayment(paymentId);
  return res.json({ success: true, data: payment });
}));

export default router;