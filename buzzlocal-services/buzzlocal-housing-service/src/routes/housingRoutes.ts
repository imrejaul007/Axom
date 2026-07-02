import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Property, FlatmateListing, PropertyInquiry, PropertyReview } from '../models/HousingModels';

const router = Router();

// Validation schemas
const propertySchema = z.object({
  type: z.enum(['rental', 'pg', 'coliving', 'apartment']),
  title: z.string().min(5),
  description: z.string().min(20),
  address: z.object({
    street: z.string(),
    area: z.string(),
    city: z.string(),
    pincode: z.string()
  }),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  monthlyRent: z.number().positive(),
  securityDeposit: z.number().nonnegative(),
  maintenance: z.number().nonnegative().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(1).optional(),
  balconies: z.number().int().min(0).optional(),
  furnished: z.enum(['full', 'semi', 'unfurnished']).optional(),
  availableFrom: z.string(),
  tenantType: z.enum(['family', 'bachelor', 'anyone']).optional(),
  foodIncluded: z.boolean().optional(),
  foodType: z.string().optional(),
  sharingType: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  societyId: z.string().optional()
});

const flatmateSchema = z.object({
  lookingFor: z.enum(['room', 'roommate']),
  budget: z.object({
    min: z.number().nonnegative(),
    max: z.number().positive()
  }),
  location: z.object({
    areas: z.array(z.string()),
    city: z.string()
  }),
  moveInDate: z.string(),
  duration: z.number().int().positive().optional(),
  age: z.number().int().min(18).max(100),
  gender: z.enum(['male', 'female', 'other']),
  occupation: z.string(),
  bio: z.string().optional(),
  habits: z.object({
    smoking: z.boolean(),
    drinking: z.enum(['never', 'occasionally', 'often']),
    pets: z.boolean(),
    lateNight: z.boolean()
  }).optional(),
  preferences: z.object({
    gender: z.enum(['male', 'female', 'no-preference']),
    smoking: z.boolean().optional(),
    pets: z.boolean().optional(),
    vegetarian: z.boolean().optional()
  }).optional(),
  interests: z.array(z.string()).optional()
});

const inquirySchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  message: z.string().optional(),
  visitDate: z.string().optional()
});

// Helper: Get user ID from header
function getUserId(req: Request): string {
  return req.headers['x-user-id'] as string || 'anonymous';
}

// ==================== PROPERTIES ====================

// GET /api/housing/properties - Search listings
router.get('/properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      type, area, city, minRent, maxRent,
      bedrooms, furnished, tenantType,
      lat, lng, radius, limit = 50, offset = 0
    } = req.query;

    const query: Record<string, unknown> = { status: 'active' };

    if (type) query.type = type;
    if (area) query['address.area'] = { $regex: area as string, $options: 'i' };
    if (city) query['address.city'] = { $regex: city as string, $options: 'i' };
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (furnished) query.furnished = furnished;
    if (tenantType) query.tenantType = tenantType;
    if (minRent) query.monthlyRent = { $gte: Number(minRent) };
    if (maxRent) query.monthlyRent = { ...(query.monthlyRent as object || {}), $lte: Number(maxRent) };

    // Geo query
    if (lat && lng && radius) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000 // km to meters
        }
      };
    }

    const properties = await Property.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    // Increment views for each
    const propertyIds = properties.map(p => p._id);
    await Property.updateMany(
      { _id: { $in: propertyIds } },
      { $inc: { views: 1 } }
    );

    res.json({ success: true, properties, count: properties.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/housing/properties/:id - Property detail
router.get('/properties/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get reviews
    const reviews = await PropertyReview.find({ propertyId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      property,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/housing/properties - Create listing
router.post('/properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = propertySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const data = validation.data;

    const property = new Property({
      ...data,
      ownerId: userId,
      availableFrom: new Date(data.availableFrom),
      views: 0,
      inquiries: 0
    });

    await property.save();

    res.json({ success: true, property });
  } catch (error) {
    next(error);
  }
});

// PUT /api/housing/properties/:id - Update listing
router.put('/properties/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = req.body;
    if (updates.availableFrom) {
      updates.availableFrom = new Date(updates.availableFrom);
    }

    Object.assign(property, updates);
    await property.save();

    res.json({ success: true, property });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/housing/properties/:id
router.delete('/properties/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await property.deleteOne();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/housing/my-properties - Own listings
router.get('/my-properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const properties = await Property.find({ ownerId: userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, properties });
  } catch (error) {
    next(error);
  }
});

// ==================== INQUIRIES ====================

// POST /api/housing/properties/:id/inquire
router.post('/properties/:id/inquire', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = inquirySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const inquiry = new PropertyInquiry({
      propertyId: req.params.id,
      seekerId: userId,
      ...validation.data,
      visitDate: validation.data.visitDate ? new Date(validation.data.visitDate) : undefined
    });

    await inquiry.save();

    // Increment inquiries count
    await Property.updateOne(
      { _id: req.params.id },
      { $inc: { inquiries: 1 } }
    );

    res.json({ success: true, inquiry });
  } catch (error) {
    next(error);
  }
});

// GET /api/housing/my-inquiries - Own inquiries (seeker)
router.get('/my-inquiries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const inquiries = await PropertyInquiry.find({ seekerId: userId })
      .populate('propertyId', 'title address images monthlyRent')
      .sort({ createdAt: -1 });

    res.json({ success: true, inquiries });
  } catch (error) {
    next(error);
  }
});

// GET /api/housing/property-inquiries - Inquiries on own properties
router.get('/property-inquiries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const myProperties = await Property.find({ ownerId: userId }).select('_id');
    const propertyIds = myProperties.map(p => p._id);

    const inquiries = await PropertyInquiry.find({ propertyId: { $in: propertyIds } })
      .sort({ createdAt: -1 });

    res.json({ success: true, inquiries });
  } catch (error) {
    next(error);
  }
});

// ==================== FLATMATE MATCHING ====================

// GET /api/housing/flatmates - Search flatmates
router.get('/flatmates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gender, minBudget, maxBudget, areas, occupation, status = 'active' } = req.query;

    const query: Record<string, unknown> = { status };

    if (gender) query.gender = gender;
    if (areas) query['location.areas'] = { $in: (areas as string).split(',') };
    if (occupation) query.occupation = { $regex: occupation as string, $options: 'i' };
    if (minBudget || maxBudget) {
      query['budget.min'] = { $lte: Number(maxBudget || Infinity) };
      query['budget.max'] = { $gte: Number(minBudget || 0) };
    }

    const flatmates = await FlatmateListing.find(query)
      .sort({ compatibilityScore: -1, createdAt: -1 })
      .limit(50);

    res.json({ success: true, flatmates, count: flatmates.length });
  } catch (error) {
    next(error);
  }
});

// POST /api/housing/flatmates - Create flatmate listing
router.post('/flatmates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = flatmateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const data = validation.data;

    // Calculate initial compatibility score (placeholder)
    const compatibilityScore = 50 + Math.random() * 30;

    const flatmate = new FlatmateListing({
      ...data,
      userId,
      moveInDate: new Date(data.moveInDate),
      compatibilityScore: Math.round(compatibilityScore)
    });

    await flatmate.save();

    res.json({ success: true, flatmate });
  } catch (error) {
    next(error);
  }
});

// GET /api/housing/flatmates/match/:id - Get matches for a listing
router.get('/flatmates/match/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await FlatmateListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Simple matching based on budget overlap and preferences
    const matches = await FlatmateListing.find({
      _id: { $ne: req.params.id },
      status: 'active',
      'budget.min': { $lte: listing.budget.max },
      'budget.max': { $gte: listing.budget.min },
      gender: listing.preferences?.gender === 'no-preference' ? { $exists: true } : listing.preferences?.gender,
      'location.city': listing.location.city
    }).limit(20);

    res.json({ success: true, matches, count: matches.length });
  } catch (error) {
    next(error);
  }
});

// ==================== REVIEWS ====================

// POST /api/housing/properties/:id/reviews
router.post('/properties/:id/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { rating, title, review, photos } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    const existing = await PropertyReview.findOne({ propertyId: req.params.id, userId });
    if (existing) {
      return res.status(400).json({ error: 'You already reviewed this property' });
    }

    const propertyReview = new PropertyReview({
      propertyId: req.params.id,
      userId,
      rating,
      title,
      review,
      photos
    });

    await propertyReview.save();

    res.json({ success: true, review: propertyReview });
  } catch (error) {
    next(error);
  }
});

// ==================== AREAS & STATS ====================

// GET /api/housing/areas - Popular areas
router.get('/areas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city = 'Bangalore' } = req.query;

    const areas = await Property.aggregate([
      { $match: { 'address.city': city, status: 'active' } },
      { $group: { _id: '$address.area', count: { $sum: 1 }, avgRent: { $avg: '$monthlyRent' } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({ success: true, areas });
  } catch (error) {
    next(error);
  }
});

// GET /api/housing/stats - Housing stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city } = req.query;
    const match = city ? { 'address.city': city, status: 'active' } : { status: 'active' };

    const stats = await Property.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgRent: { $avg: '$monthlyRent' },
          minRent: { $min: '$monthlyRent' },
          maxRent: { $max: '$monthlyRent' },
          rentals: { $sum: { $cond: [{ $eq: ['$type', 'rental'] }, 1, 0] } },
          pgs: { $sum: { $cond: [{ $eq: ['$type', 'pg'] }, 1, 0] } },
          colivings: { $sum: { $cond: [{ $eq: ['$type', 'coliving'] }, 1, 0] } }
        }
      }
    ]);

    res.json({ success: true, stats: stats[0] || {} });
  } catch (error) {
    next(error);
  }
});

export default router;
