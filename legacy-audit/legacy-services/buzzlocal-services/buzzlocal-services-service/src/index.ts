/**
 * BuzzLocal Services Directory - Local services marketplace
 * Port: 4024
 *
 * Features:
 * - Service categories
 * - Provider listings
 * - Ratings and reviews
 * - Instant booking
 * - REZ Coins support
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../shared/utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4024;

app.use(cors());
app.use(express.json());

// ===== SCHEMAS =====

const serviceCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: String,
  description: String,
  subcategories: [String],
  providers: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 }
});

const serviceProviderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: String,
  category: { type: String, required: true, index: true },
  subcategory: String,
  description: String,
  services: [{
    name: String,
    price: Number,
    unit: String,
    description: String
  }],
  area: { type: String, index: true },
  location: {
    lat: Number,
    lng: Number
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  workingHours: {
    start: String,
    end: String
  },
  photos: [String],
  coinsAccepted: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  providerId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  service: String,
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  providerId: { type: String, required: true },
  userId: { type: String, required: true },
  service: {
    name: String,
    price: Number
  },
  scheduledAt: Date,
  status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  address: String,
  notes: String,
  payment: {
    method: { type: String, enum: ['coins', 'cash', 'online'] },
    amount: Number,
    coins: Number,
    paid: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

const ServiceCategory = mongoose.models.ServiceCategory || mongoose.model('ServiceCategory', serviceCategorySchema);
const ServiceProvider = mongoose.models.ServiceProvider || mongoose.model('ServiceProvider', serviceProviderSchema);
const ServiceReview = mongoose.models.ServiceReview || mongoose.model('ServiceReview', reviewSchema);
const ServiceBooking = mongoose.models.ServiceBooking || mongoose.model('ServiceBooking', bookingSchema);

// ===== SEED CATEGORIES =====

const seedCategories = async () => {
  const count = await ServiceCategory.countDocuments();
  if (count === 0) {
    const categories = [
      { id: 'home', name: 'Home Services', icon: 'home', description: 'Repairs, cleaning, plumbing, electrical', subcategories: ['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting'] },
      { id: 'beauty', name: 'Beauty & Wellness', icon: 'cut', description: 'Salon, spa, grooming', subcategories: ['Salon', 'Spa', 'Massage', 'Grooming'] },
      { id: 'fitness', name: 'Fitness', icon: 'fitness', description: 'Trainers, yoga, gym', subcategories: ['Personal Trainer', 'Yoga', 'Gym', 'Nutritionist'] },
      { id: 'healthcare', name: 'Healthcare', icon: 'medical', description: 'Doctors, nurses, therapists', subcategories: ['Doctor', 'Nurse', 'Physiotherapist', 'Lab Tests'] },
      { id: 'education', name: 'Education', icon: 'school', description: 'Tutors, classes, coaching', subcategories: ['Tution', 'Coaching', 'Language', 'Music'] },
      { id: 'petcare', name: 'Pet Care', icon: 'paw', description: 'Vets, groomers, walkers', subcategories: ['Veterinary', 'Grooming', 'Walking', 'Boarding'] },
      { id: 'events', name: 'Events', icon: 'calendar', description: 'Photographers, decorators, caterers', subcategories: ['Photography', 'Catering', 'Decoration', 'DJ'] },
      { id: 'professional', name: 'Professional', icon: 'briefcase', description: 'Lawyers, accountants, consultants', subcategories: ['Legal', 'Financial', 'IT Support', 'Design'] }
    ];

    await ServiceCategory.insertMany(categories);
    logger.info('Seeded service categories');
  }
};

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-services-service',
    version: '1.0.0',
    features: ['categories', 'providers', 'reviews', 'bookings']
  });
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    logger.error('Get categories error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get providers
app.get('/api/providers', async (req, res) => {
  try {
    const { category, area, search, minRating, sort = 'rating', limit = 20, offset = 0 } = req.query;

    const query: any = { available: true };
    if (category) query.category = category;
    if (area) query.area = { $regex: area, $options: 'i' };
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption: any = { rating: -1, completedJobs: -1 };
    if (sort === 'price_low') sortOption = { 'services.price': 1 };
    if (sort === 'jobs') sortOption = { completedJobs: -1 };
    if (sort === 'recent') sortOption = { createdAt: -1 };

    const providers = await ServiceProvider.find(query)
      .sort(sortOption)
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await ServiceProvider.countDocuments(query);

    res.json({
      providers,
      pagination: { total, limit: Number(limit), offset: Number(offset), hasMore: Number(offset) + providers.length < total }
    });
  } catch (error) {
    logger.error('Get providers error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get provider details
app.get('/api/providers/:id', async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ id: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const reviews = await ServiceReview.find({ providerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ provider, reviews });
  } catch (error) {
    logger.error('Get provider error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// Register as provider
app.post('/api/providers', async (req, res) => {
  try {
    const id = uuidv4();

    const provider = new ServiceProvider({
      id,
      ...req.body
    });

    await provider.save();

    // Update category count
    await ServiceCategory.findOneAndUpdate(
      { id: req.body.category },
      { $inc: { providers: 1 } }
    );

    res.status(201).json({ success: true, provider });
  } catch (error) {
    logger.error('Create provider error', { error: String(error) });
    res.status(500).json({ error: 'Failed to create provider' });
  }
});

// Get provider reviews
app.get('/api/providers/:id/reviews', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const reviews = await ServiceReview.find({ providerId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await ServiceReview.countDocuments({ providerId: req.params.id });

    res.json({ reviews, pagination: { total, limit: Number(limit), offset: Number(offset) } });
  } catch (error) {
    logger.error('Get reviews error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  try {
    const id = uuidv4();

    const booking = new ServiceBooking({
      id,
      ...req.body
    });

    await booking.save();

    res.status(201).json({ success: true, booking });
  } catch (error) {
    logger.error('Create booking error', { error: String(error) });
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user bookings
app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const { status } = req.query;

    const query: any = { userId: req.params.userId };
    if (status) query.status = status;

    const bookings = await ServiceBooking.find(query).sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    logger.error('Get bookings error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { status, payment } = req.body;

    const updateData: any = {};
    if (status) updateData['status'] = status;
    if (payment) updateData['payment'] = payment;

    const booking = await ServiceBooking.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    logger.error('Update booking error', { error: String(error) });
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Get provider bookings
app.get('/api/bookings/provider/:providerId', async (req, res) => {
  try {
    const { status } = req.query;

    const query: any = { providerId: req.params.providerId };
    if (status) query.status = status;

    const bookings = await ServiceBooking.find(query)
      .sort({ scheduledAt: 1 });

    res.json({ bookings });
  } catch (error) {
    logger.error('Get provider bookings error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_services';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('Services: Connected to MongoDB');
    await seedCategories();
  })
  .catch((err) => logger.error('Services: MongoDB connection error', { error: String(err) }));

// Start server
app.listen(PORT, () => {
  logger.startup(PORT, [
    '8 service categories',
    'Provider listings',
    'Reviews & ratings',
    'Booking system',
    'REZ Coins support'
  ]);
});

export { app };
