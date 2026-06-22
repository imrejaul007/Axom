/**
 * BuzzLocal Marketplace Service - Hyperlocal Buy/Sell
 * Port: 4032
 *
 * Features:
 * - Listing management
 * - Category browsing
 * - Search
 * - Seller reputation
 * - Chat messaging
 * - AI scam detection
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4032;

app.use(cors());
app.use(express.json());

// ===== SCHEMAS =====

const listingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sellerId: { type: String, required: true, index: true },
  sellerName: String,
  sellerTrust: Number,
  title: { type: String, required: true },
  description: String,
  price: Number,
  negotiable: { type: Boolean, default: true },
  category: { type: String, enum: ['electronics', 'housing', 'furniture', 'vehicles', 'fashion', 'services', 'jobs', 'other'], index: true },
  subcategory: String,
  images: [String],
  condition: { type: String, enum: ['new', 'like_new', 'good', 'fair'] },
  area: { type: String, index: true },
  location: {
    lat: Number,
    lng: Number
  },
  status: { type: String, enum: ['active', 'sold', 'reserved', 'deleted'], default: 'active', index: true },
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  chats: { type: Number, default: 0 },
  scamScore: { type: Number, default: 0 },
  scamFlags: [String],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: Date
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  listingId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// ===== VALIDATION SCHEMAS =====

const createListingSchema = z.object({
  sellerId: z.string(),
  sellerName: z.string(),
  sellerTrust: z.number().min(0).max(100),
  title: z.string().min(5).max(100),
  description: z.string().max(2000),
  price: z.number().positive(),
  negotiable: z.boolean().default(true),
  category: z.enum(['electronics', 'housing', 'furniture', 'vehicles', 'fashion', 'services', 'jobs', 'other']),
  subcategory: z.string().optional(),
  images: z.array(z.string()).max(10),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  area: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

const sendMessageSchema = z.object({
  listingId: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1).max(1000)
});

// ===== HELPER FUNCTIONS =====

// Simple scam detection (AI would be more sophisticated)
function detectScam(listing: any): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  // Price too low
  if (listing.price < 100 && listing.category === 'electronics') {
    flags.push('Suspiciously low price');
    score += 30;
  }

  // No images
  if (!listing.images || listing.images.length === 0) {
    flags.push('No images provided');
    score += 10;
  }

  // Very short description
  if (listing.description && listing.description.length < 20) {
    flags.push('Very short description');
    score += 15;
  }

  // New seller with expensive item
  if (listing.sellerTrust < 50 && listing.price > 10000) {
    flags.push('Unverified seller with expensive item');
    score += 25;
  }

  return { score, flags };
}

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-marketplace-service',
    version: '1.0.0',
    features: [
      'listings',
      'search',
      'messaging',
      'scam-detection'
    ]
  });
});

// Create listing
app.post('/api/listings', async (req, res) => {
  try {
    const data = createListingSchema.parse(req.body);
    const id = uuidv4();

    // Run scam detection
    const { score, flags } = detectScam(data);

    const listing = new Listing({
      id,
      ...data,
      location: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : undefined,
      scamScore: score,
      scamFlags: flags,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await listing.save();

    res.status(201).json({
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        status: listing.status,
        scamFlags: listing.scamFlags
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to create listing' });
  }
});

// Get listings with filters
app.get('/api/listings', async (req, res) => {
  try {
    const { category, area, search, minPrice, maxPrice, condition, sort = 'recent', limit = 20, offset = 0 } = req.query;

    const query: any = { status: 'active' };

    if (category) query.category = category;
    if (area) query.area = { $regex: area, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (condition) query.condition = condition;

    let sortOption: any = { createdAt: -1 };
    if (sort === 'price_low') sortOption = { price: 1 };
    if (sort === 'price_high') sortOption = { price: -1 };
    if (sort === 'popular') sortOption = { views: -1 };

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const listings = await Listing.find(query)
      .sort(sortOption)
      .skip(Number(offset))
      .limit(Number(limit))
      .select('-scamScore -scamFlags');

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + listings.length < total
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// Get single listing
app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findOne({ id: req.params.id });

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    res.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
});

// Get user's listings
app.get('/api/listings/user/:userId', async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const listings = await Listing.find({
      sellerId: req.params.userId,
      status: status as string
    }).sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// Update listing
app.patch('/api/listings/:id', async (req, res) => {
  try {
    const { title, description, price, negotiable, images, status } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (negotiable !== undefined) updateData.negotiable = negotiable;
    if (images) updateData.images = images;
    if (status) updateData.status = status;

    const listing = await Listing.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    res.json({ success: true, listing });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to update listing' });
  }
});

// Delete listing
app.delete('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { id: req.params.id },
      { status: 'deleted', updatedAt: new Date() },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete listing' });
  }
});

// Save listing (bookmark)
app.post('/api/listings/:id/save', async (req, res) => {
  try {
    const { userId } = req.body;

    // In production, would save to user_saves collection
    const listing = await Listing.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { saves: 1 } },
      { new: true }
    );

    res.json({ success: true, saves: listing?.saves });
  } catch (error) {
    console.error('Save listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to save listing' });
  }
});

// Send message
app.post('/api/messages', async (req, res) => {
  try {
    const data = sendMessageSchema.parse(req.body);

    const message = new Message({
      id: uuidv4(),
      ...data
    });

    await message.save();

    // Update listing chat count
    await Listing.findOneAndUpdate(
      { id: data.listingId },
      { $inc: { chats: 1 } }
    );

    res.status(201).json({ success: true, message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Get messages for listing
app.get('/api/messages/listing/:listingId', async (req, res) => {
  try {
    const { userId } = req.query;

    const messages = await Message.find({
      listingId: req.params.listingId,
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      {
        listingId: req.params.listingId,
        receiverId: userId,
        read: false
      },
      { read: true }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Get user's conversations
app.get('/api/messages/conversations/:userId', async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.params.userId },
            { receiverId: req.params.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$listingId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', req.params.userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({ conversations: messages });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

// Get categories with counts
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Listing.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const categoryMap: Record<string, { count: number; avgPrice: number }> = {};
    categories.forEach(cat => {
      categoryMap[cat._id] = { count: cat.count, avgPrice: Math.round(cat.avgPrice || 0) };
    });

    res.json({
      categories: [
        { id: 'electronics', name: 'Electronics', icon: 'phone-portrait', count: categoryMap.electronics?.count || 0 },
        { id: 'housing', name: 'Housing', icon: 'home', count: categoryMap.housing?.count || 0 },
        { id: 'furniture', name: 'Furniture', icon: 'bed', count: categoryMap.furniture?.count || 0 },
        { id: 'vehicles', name: 'Vehicles', icon: 'car', count: categoryMap.vehicles?.count || 0 },
        { id: 'fashion', name: 'Fashion', icon: 'shirt', count: categoryMap.fashion?.count || 0 },
        { id: 'services', name: 'Services', icon: 'briefcase', count: categoryMap.services?.count || 0 },
        { id: 'jobs', name: 'Jobs', icon: 'work', count: categoryMap.jobs?.count || 0 },
        { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', count: categoryMap.other?.count || 0 }
      ]
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// ===== MONGOOSE CONNECTION =====

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_marketplace';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Marketplace: Connected to MongoDB'))
  .catch((err) => console.error('Marketplace: MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  logger.info(
╔═══════════════════════════════════════════════════════════════╗
║       BuzzLocal Marketplace Service              ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Features:                                            ║
║  • Listings CRUD                                     ║
║  • Category browsing                                 ║
║  • Search                                            ║
║  • Messaging                                         ║
║  • AI Scam Detection                                 ║
║  • Seller reputation                                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export { app };
