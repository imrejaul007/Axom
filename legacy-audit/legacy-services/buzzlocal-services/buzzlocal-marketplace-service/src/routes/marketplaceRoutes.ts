import { Router, Request, Response, NextFunction } from 'express';
import { Listing } from '../models/Listing';

export const router = Router();

// GET /api/marketplace/listings
router.get('/listings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, area, minPrice, maxPrice, status = 'active', limit = 20, offset = 0 } = req.query;
    const query: any = { status };
    if (category) query.category = category;
    if (area) query['location.area'] = area;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const listings = await Listing.find(query).sort({ createdAt: -1 }).skip(Number(offset)).limit(Number(limit));
    const total = await Listing.countDocuments(query);
    res.json({ success: true, listings, total, offset, limit });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketplace/listings/:id
router.get('/listings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    listing.views += 1;
    await listing.save();
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
});

// POST /api/marketplace/listings
router.post('/listings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const listing = new Listing({ ...req.body, sellerId: userId });
    await listing.save();
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
});

// PUT /api/marketplace/listings/:id
router.put('/listings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId !== userId) return res.status(403).json({ error: 'Not authorized' });
    Object.assign(listing, req.body);
    await listing.save();
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/marketplace/listings/:id
router.delete('/listings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId !== userId) return res.status(403).json({ error: 'Not authorized' });
    listing.status = 'sold';
    await listing.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/marketplace/listings/:id/interest
router.post('/listings/:id/interest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    listing.interestedCount += 1;
    await listing.save();
    res.json({ success: true, interestedCount: listing.interestedCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketplace/my-listings
router.get('/my-listings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const listings = await Listing.find({ sellerId: userId }).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketplace/categories
router.get('/categories', (req: Request, res: Response) => {
  const categories = [
    { id: 'furniture', label: 'Furniture', icon: 'bed' },
    { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
    { id: 'housing', label: 'PG/Rooms', icon: 'home' },
    { id: 'vehicles', label: 'Vehicles', icon: 'car' },
    { id: 'books', label: 'Books', icon: 'book' },
    { id: 'fashion', label: 'Fashion', icon: 'shirt' },
    { id: 'services', label: 'Services', icon: 'construct' },
    { id: 'tickets', label: 'Tickets', icon: 'ticket' },
    { id: 'kids', label: 'Kids', icon: 'happy' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' }
  ];
  res.json({ success: true, categories });
});
