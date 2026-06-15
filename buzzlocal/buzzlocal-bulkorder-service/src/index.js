/**
 * BuzzLocal Bulk Order Service
 * FreshMart 4PM Story: Community Commerce
 *
 * "Apartment society needs 200 milk packets → NeighborAI discovers → FreshMart fulfills"
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const bulkOrderRoutes = require('./routes/bulkorder.routes');

const app = express();
const PORT = process.env.PORT || 4019;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-bulkorder-service',
    version: '1.0.0',
    freshMartStory: '4PM - Community Commerce'
  });
});

// Routes
app.use('/api/bulkorder', bulkOrderRoutes);

// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/buzzlocal-bulkorder';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('🚀 Bulk Order Service ready');
    console.log('📍 Port:', PORT);
    console.log('🏘️ FreshMart 4PM Story: Community Commerce');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🏘️ BuzzLocal Bulk Order Service');
  console.log('📖 FreshMart 4PM Story: Community Commerce');
  console.log('═══════════════════════════════════════════════════');
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/bulkorder/create');
  console.log('  POST /api/bulkorder/:id/join');
  console.log('  POST /api/bulkorder/:id/confirm');
  console.log('  POST /api/bulkorder/:id/fulfill');
  console.log('  GET  /api/bulkorder/neighborhood/:name');
  console.log('  GET  /api/bulkorder/store/:storeId');
  console.log('  GET  /api/bulkorder/:id');
  console.log('  DELETE /api/bulkorder/:id');
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
