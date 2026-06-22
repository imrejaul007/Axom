import { Router, Request, Response, NextFunction } from 'express';
import { ServiceProvider, ServiceBooking, ServiceReview, CATEGORIES } from '../models/ServiceModels';

export const router = Router();

// GET /api/services/categories
router.get('/categories', (req: Request, res: Response) => {
  res.json({ success: true, categories: CATEGORIES });
});

// GET /api/services/providers
router.get('/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, area, minRating, availability = 'available' } = req.query;
    const query: any = { availability };
    if (category) query.category = category;
    if (area) query.areas = area;
    if (minRating) query.rating = { $gte: Number(minRating) };
    const providers = await ServiceProvider.find(query).sort({ rating: -1, reviewCount: -1 }).limit(50);
    res.json({ success: true, providers });
  } catch (error) {
    next(error);
  }
});

// GET /api/services/providers/:id
router.get('/providers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    const reviews = await ServiceReview.find({ providerId: provider.userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, provider, reviews });
  } catch (error) {
    next(error);
  }
});

// POST /api/services/providers
router.post('/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const provider = new ServiceProvider({ ...req.body, userId });
    await provider.save();
    res.json({ success: true, provider });
  } catch (error) {
    next(error);
  }
});

// PUT /api/services/providers/:id
router.put('/providers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (provider.userId !== userId) return res.status(403).json({ error: 'Not authorized' });
    Object.assign(provider, req.body);
    await provider.save();
    res.json({ success: true, provider });
  } catch (error) {
    next(error);
  }
});

// POST /api/services/book
router.post('/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const booking = new ServiceBooking({ ...req.body, customerId: userId, status: 'pending' });
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

// GET /api/services/bookings
router.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { role = 'customer' } = req.query;
    const query = role === 'provider' ? { providerId: userId } : { customerId: userId };
    const bookings = await ServiceBooking.find(query).sort({ date: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/services/bookings/:id
router.put('/bookings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.customerId !== userId) return res.status(403).json({ error: 'Not authorized' });
    Object.assign(booking, req.body);
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

// POST /api/services/review
router.post('/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { providerId, bookingId, rating, comment } = req.body;
    const review = new ServiceReview({ providerId, customerId: userId, bookingId, rating, comment });
    await review.save();
    // Update provider rating
    const reviews = await ServiceReview.find({ providerId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await ServiceProvider.findOneAndUpdate({ userId: providerId }, { rating: avgRating, reviewCount: reviews.length });
    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

// GET /api/services/reviews/:providerId
router.get('/reviews/:providerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await ServiceReview.find({ providerId: req.params.providerId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
});
