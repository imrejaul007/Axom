import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Tenant, RentPayment, MaintenanceRequest, PropertyDocument } from '../models/PropertyModels';

const router = Router();

function getUserId(req: Request): string {
  return req.headers['x-user-id'] as string || 'anonymous';
}

// ==================== TENANTS ====================

// GET /api/property/tenants - Own tenants
router.get('/tenants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { status } = req.query;

    const query: Record<string, unknown> = { ownerId: userId };
    if (status) query.status = status;

    const tenants = await Tenant.find(query).sort({ createdAt: -1 });
    res.json({ success: true, tenants });
  } catch (error) {
    next(error);
  }
});

// POST /api/property/tenants - Add tenant
router.post('/tenants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const tenant = new Tenant({ ...req.body, ownerId: userId });
    await tenant.save();
    res.json({ success: true, tenant });
  } catch (error) {
    next(error);
  }
});

// GET /api/property/tenants/:id
router.get('/tenants/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ success: true, tenant });
  } catch (error) {
    next(error);
  }
});

// PUT /api/property/tenants/:id
router.put('/tenants/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const tenant = await Tenant.findOne({ _id: req.params.id, ownerId: userId });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    Object.assign(tenant, req.body);
    await tenant.save();
    res.json({ success: true, tenant });
  } catch (error) {
    next(error);
  }
});

// PUT /api/property/tenants/:id/status - Update status
router.put('/tenants/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body;

    const validStatuses = ['inquiry', 'visited', 'booked', 'active', 'notice', 'vacated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, ownerId: userId },
      {
        status,
        ...(status === 'active' && { moveInDate: new Date() }),
        ...(status === 'vacated' && { moveOutDate: new Date() })
      },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ success: true, tenant });
  } catch (error) {
    next(error);
  }
});

// ==================== RENT PAYMENTS ====================

// GET /api/property/payments - Own payments
router.get('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { status, month } = req.query;

    const query: Record<string, unknown> = { ownerId: userId };
    if (status) query.status = status;
    if (month) query.forMonth = new Date(month as string);

    const payments = await RentPayment.find(query).sort({ forMonth: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

// POST /api/property/payments - Record payment
router.post('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { tenantId, amount, forMonth, paymentMethod, transactionId, remarks } = req.body;

    const payment = new RentPayment({
      tenantId,
      ownerId: userId,
      amount,
      forMonth: new Date(forMonth),
      dueDate: new Date(forMonth),
      paidDate: new Date(),
      status: 'paid',
      paymentMethod,
      transactionId,
      remarks
    });

    await payment.save();

    // Update tenant balance
    await Tenant.updateOne(
      { _id: tenantId },
      { $inc: { currentBalance: -amount } }
    );

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

// POST /api/property/payments/generate - Generate monthly rent
router.post('/payments/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { month, tenantIds } = req.body;

    // Get active tenants
    const query: Record<string, unknown> = { ownerId: userId, status: 'active' };
    if (tenantIds?.length) query._id = { $in: tenantIds };

    const tenants = await Tenant.find(query);

    const payments = [];
    for (const tenant of tenants) {
      const existing = await RentPayment.findOne({
        tenantId: tenant._id.toString(),
        forMonth: new Date(month)
      });

      if (!existing) {
        const amount = tenant.monthlyRent + (tenant.maintenanceCharges || 0);
        const payment = new RentPayment({
          tenantId: tenant._id.toString(),
          ownerId: userId,
          propertyId: tenant.propertyId,
          amount,
          forMonth: new Date(month),
          dueDate: new Date(new Date(month).setDate(tenant.rentDueDate))
        });
        await payment.save();
        payments.push(payment);

        // Update tenant balance
        await Tenant.updateOne(
          { _id: tenant._id },
          { $inc: { currentBalance: amount } }
        );
      }
    }

    res.json({ success: true, generated: payments.length, payments });
  } catch (error) {
    next(error);
  }
});

// GET /api/property/tenants/:id/payments
router.get('/tenants/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await RentPayment.find({ tenantId: req.params.id }).sort({ forMonth: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

// ==================== MAINTENANCE ====================

// GET /api/property/maintenance
router.get('/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { status, priority } = req.query;

    const query: Record<string, unknown> = { ownerId: userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const requests = await MaintenanceRequest.find(query).sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// POST /api/property/maintenance
router.post('/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const request = new MaintenanceRequest({ ...req.body, ownerId: userId });
    await request.save();
    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});

// PUT /api/property/maintenance/:id/status
router.put('/maintenance/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { status, assignedTo, cost, feedback, rating } = req.body;

    const updates: Record<string, unknown> = { status };
    if (assignedTo) updates.assignedTo = assignedTo;
    if (cost !== undefined) updates.cost = cost;
    if (status === 'completed') updates.completedDate = new Date();
    if (feedback) updates.feedback = feedback;
    if (rating) updates.rating = rating;

    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: req.params.id, ownerId: userId },
      updates,
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});

// ==================== DOCUMENTS ====================

// POST /api/property/tenants/:id/documents
router.post('/tenants/:id/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const tenant = await Tenant.findOne({ _id: req.params.id, ownerId: userId });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const doc = new PropertyDocument({
      ...req.body,
      tenantId: req.params.id,
      ownerId: userId,
      propertyId: tenant.propertyId
    });
    await doc.save();
    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
});

// GET /api/property/tenants/:id/documents
router.get('/tenants/:id/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await PropertyDocument.find({ tenantId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (error) {
    next(error);
  }
});

// PUT /api/property/documents/:id/verify
router.put('/documents/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const doc = await PropertyDocument.findOneAndUpdate(
      { _id: req.params.id, ownerId: userId },
      { verified: true, verifiedAt: new Date(), verifiedBy: userId },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
});

// ==================== DASHBOARD STATS ====================

// GET /api/property/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const [tenants, payments, maintenance] = await Promise.all([
      Tenant.find({ ownerId: userId }),
      RentPayment.find({ ownerId: userId }),
      MaintenanceRequest.find({ ownerId: userId })
    ]);

    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const totalRentDue = tenants.reduce((sum, t) => sum + (t.currentBalance > 0 ? t.currentBalance : 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'late').length;
    const pendingMaintenance = maintenance.filter(m => m.status !== 'completed' && m.status !== 'cancelled').length;

    // This month's collection
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthPayments = payments.filter(p =>
      new Date(p.forMonth) >= thisMonth && p.status === 'paid'
    );
    const collectedThisMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      stats: {
        totalTenants: tenants.length,
        activeTenants,
        totalRentDue: Math.round(totalRentDue),
        collectedThisMonth: Math.round(collectedThisMonth),
        pendingPayments,
        pendingMaintenance
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/property/collection-summary
router.get('/collection-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const payments = await RentPayment.aggregate([
      { $match: { ownerId: userId, forMonth: { $gte: startDate }, status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$forMonth' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, summary: payments });
  } catch (error) {
    next(error);
  }
});

export default router;
