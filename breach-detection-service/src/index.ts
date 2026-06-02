/**
 * TrustOS Breach Detection Service
 * Dark web monitoring and breach alerting
 *
 * Port: 4170
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4170', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/breach_detection';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MODELS
// ============================================

// Breached data record
const breachSchema = new mongoose.Schema({
  email: { type: String, index: true },
  phone: { type: String, index: true },
  aadhaar: { type: String },
  pan: { type: String },
  password: { type: String },
  source: { type: String, required: true },
  breachDate: { type: Date },
  dataTypes: [{ type: String }],
  affectedCount: { type: Number },
});

const BreachRecord = mongoose.model('BreachRecord', breachSchema);

// Monitored items
const monitoredItemSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['email', 'phone', 'aadhaar', 'pan'], required: true },
  value: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  lastChecked: { type: Date },
  breachCount: { type: Number, default: 0 },
  alerts: [{
    breachId: { type: mongoose.Schema.Types.ObjectId, ref: 'BreachRecord' },
    detectedAt: { type: Date },
    notified: { type: Boolean, default: false },
  }],
});

const MonitoredItem = mongoose.model('MonitoredItem', monitoredItemSchema);

// ============================================
// SIMULATED BREACH DATABASE
// ============================================

// In production, this would connect to real breach databases like HaveIBeenPwned
const SIMULATED_BREACHES = [
  {
    email: 'test@example.com',
    phone: '9876543210',
    source: 'LinkedIn 2021',
    breachDate: new Date('2021-06-01'),
    dataTypes: ['email', 'password', 'phone'],
    affectedCount: 700000000,
  },
  {
    email: 'demo@test.com',
    source: 'Adobe 2013',
    breachDate: new Date('2013-10-04'),
    dataTypes: ['email', 'password'],
    affectedCount: 153000000,
  },
];

// ============================================
// SERVICES
// ============================================

/**
 * Check if data appears in known breaches
 */
async function checkBreach(type: string, value: string): Promise<{
  breached: boolean;
  breaches: any[];
}> {
  const breaches: any[] = [];

  // Check simulated database
  for (const breach of SIMULATED_BREACHES) {
    if (breach[type] === value) {
      breaches.push({
        source: breach.source,
        date: breach.breachDate,
        dataTypes: breach.dataTypes,
        affectedCount: breach.affectedCount,
        description: `Data breach from ${breach.source}`,
      });
    }
  }

  // Also check MongoDB
  const dbBreaches = await BreachRecord.find({ [type]: value });
  for (const breach of dbBreaches) {
    breaches.push({
      source: breach.source,
      date: breach.breachDate,
      dataTypes: breach.dataTypes,
      affectedCount: breach.affectedCount,
    });
  }

  return {
    breached: breaches.length > 0,
    breaches,
  };
}

/**
 * Add item to monitoring
 */
async function addToMonitoring(
  userId: string,
  type: string,
  value: string
): Promise<MonitoredItem> {
  // Check if already monitored
  let item = await MonitoredItem.findOne({ userId, type, value });

  if (item) {
    return item;
  }

  // Add new item
  item = new MonitoredItem({
    userId,
    type,
    value,
    lastChecked: new Date(),
  });

  await item.save();

  // Check for existing breaches immediately
  const breachResult = await checkBreach(type, value);
  if (breachResult.breached) {
    item.breachCount = breachResult.breaches.length;
    await item.save();
  }

  return item;
}

/**
 * Get user's monitored items
 */
async function getUserMonitored(userId: string): Promise<MonitoredItem[]> {
  return MonitoredItem.find({ userId });
}

/**
 * Get user's breach alerts
 */
async function getUserBreaches(userId: string): Promise<any[]> {
  const items = await MonitoredItem.find({ userId, breachCount: { $gt: 0 } });
  const breachIds = items.flatMap(item => item.alerts.map(a => a.breachId));

  if (breachIds.length === 0) {
    return [];
  }

  return BreachRecord.find({ _id: { $in: breachIds } });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'breach-detection-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Check for breach
app.post('/breach/check', async (req: Request, res: Response) => {
  const { email, phone, aadhaar, pan, userId } = req.body;

  try {
    let result;

    if (email) {
      result = await checkBreach('email', email);
    } else if (phone) {
      result = await checkBreach('phone', phone);
    } else if (aadhaar) {
      result = await checkBreach('aadhaar', aadhaar);
    } else if (pan) {
      result = await checkBreach('pan', pan);
    } else {
      res.status(400).json({ error: 'Provide email, phone, aadhaar, or pan' });
      return;
    }

    // Calculate risk level
    let riskLevel = 'low';
    if (result.breaches.length >= 3) {
      riskLevel = 'critical';
    } else if (result.breaches.length >= 2) {
      riskLevel = 'high';
    } else if (result.breaches.length >= 1) {
      riskLevel = 'medium';
    }

    res.json({
      success: true,
      data: {
        breached: result.breached,
        breaches: result.breaches,
        riskLevel,
        recommendations: result.breached
          ? [
              'Change your password immediately',
              'Enable two-factor authentication',
              'Monitor your accounts for suspicious activity',
              'Review recent transactions',
            ]
          : [
              'Continue monitoring your data',
              'Use unique passwords for each service',
              'Enable two-factor authentication',
            ],
      },
    });
  } catch (error) {
    console.error('Breach check error:', error);
    res.status(500).json({ error: 'Failed to check breach' });
  }
});

// Add to monitoring
app.post('/breach/monitor', async (req: Request, res: Response) => {
  const { userId, type, value } = req.body;

  if (!userId || !type || !value) {
    res.status(400).json({ error: 'userId, type, and value are required' });
    return;
  }

  try {
    const item = await addToMonitoring(userId, type, value);

    res.json({
      success: true,
      data: {
        id: item._id,
        userId: item.userId,
        type: item.type,
        value: item.value,
        breachCount: item.breachCount,
        addedAt: item.addedAt,
      },
    });
  } catch (error) {
    console.error('Add monitoring error:', error);
    res.status(500).json({ error: 'Failed to add monitoring' });
  }
});

// Get user's monitored items
app.get('/breach/monitor/:userId', async (req: Request, res: Response) => {
  try {
    const items = await getUserMonitored(req.params.userId);

    res.json({
      success: true,
      data: items.map(item => ({
        id: item._id,
        type: item.type,
        value: item.value,
        breachCount: item.breachCount,
        lastChecked: item.lastChecked,
        addedAt: item.addedAt,
      })),
    });
  } catch (error) {
    console.error('Get monitored error:', error);
    res.status(500).json({ error: 'Failed to get monitored items' });
  }
});

// Get user's breaches
app.get('/breach/alerts/:userId', async (req: Request, res: Response) => {
  try {
    const breaches = await getUserBreaches(req.params.userId);

    res.json({
      success: true,
      data: breaches.map(b => ({
        source: b.source,
        date: b.breachDate,
        dataTypes: b.dataTypes,
        affectedCount: b.affectedCount,
      })),
    });
  } catch (error) {
    console.error('Get breaches error:', error);
    res.status(500).json({ error: 'Failed to get breaches' });
  }
});

// Remove from monitoring
app.delete('/breach/monitor/:userId/:type/:value', async (req: Request, res: Response) => {
  try {
    const { userId, type, value } = req.params;

    await MonitoredItem.deleteOne({ userId, type, value });

    res.json({
      success: true,
      message: 'Removed from monitoring',
    });
  } catch (error) {
    console.error('Remove monitoring error:', error);
    res.status(500).json({ error: 'Failed to remove monitoring' });
  }
});

// ============================================
// STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║     TrustOS Breach Detection Service      ║
╠════════════════════════════════════════════╣
║  Status:    RUNNING                     ║
║  Port:      ${PORT}                            ║
║  Database:  MongoDB connected          ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
