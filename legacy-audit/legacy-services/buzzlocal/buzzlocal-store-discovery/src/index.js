/**
 * BuzzLocal Store Discovery Service
 * FreshMart 9AM Story: "Family moves into HSR → searches 'grocery store near me' → BuzzLocal recommends FreshMart"
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const discoveryRoutes = require('./routes/storeDiscovery.routes');

const app = express();
const PORT = process.env.PORT || 4020;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'buzzlocal-store-discovery', version: '1.0.0' });
});

app.use('/api/discovery', discoveryRoutes);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-store-discovery')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🏪 BuzzLocal Store Discovery Service');
  console.log('📖 FreshMart 9AM: Store Discovery');
  console.log('═══════════════════════════════════════════════════');
  console.log('Port:', PORT);
  console.log('Endpoints:');
  console.log('  POST /api/discovery/stores');
  console.log('  GET  /api/discovery/stores/nearby');
  console.log('  POST /api/discovery/stores/select');
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
