/**
 * TrustOS Breach Detection Service
 * Dark web monitoring and data breach detection
 *
 * Port: 4170
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import axios from 'axios';
import { logger } from './shared/logger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4170', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/breach_detection';
const HIBP_API_KEY = process.env.HIBP_API_KEY || '';

// ============================================
// MONGODB MODELS
// ============================================

// Breached accounts
const breachRecordSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  breaches: [{
    name: String,
    title: String,
    domain: String,
    breachDate: Date,
    addedDate: Date,
    modifiedDate: Date,
    pwnCount: Number,
    description: String,
    logoPath: String,
    dataClasses: [String],
    isVerified: Boolean,
    isFabricated: Boolean,
    isSensitive: Boolean,
    isRetired: Boolean,
    isSpamList: Boolean,
    isMalware: Boolean,
    isSubscriptionFree: Boolean,
  }],
  lastChecked: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BreachRecord = mongoose.model('BreachRecord', breachRecordSchema);

// Monitored items
const monitoredItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['email', 'phone', 'domain'], required: true },
  value: { type: String, required: true, index: true },
  userId: String,
  notifyEmail: String,
  notifyPhone: String,
  webhookUrl: String,
  isActive: { type: Boolean, default: true },
  lastNotified: Date,
  notifyOnNewBreach: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const MonitoredItem = mongoose.model('MonitoredItem', monitoredItemSchema);

// Breach alerts
const breachAlertSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  breachName: String,
  breachDate: Date,
  affectedData: [String],
  notified: { type: Boolean, default: false },
  notifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const BreachAlert = mongoose.model('BreachAlert', breachAlertSchema);

// ============================================
// HAVE I BEEN PWNED API INTEGRATION
// ============================================

interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  IsMalware: boolean;
  IsSubscriptionFree: boolean;
}

interface HIBPPaste {
  Id: string;
  Source: string;
  Title: string;
  Date: string;
  EmailCount: string;
  PasteId: string;
}

/**
 * Check if email was in any breach (using HIBP API)
 */
async function checkHIBPBreaches(email: string): Promise<HIBPBreach[]> {
  if (!HIBP_API_KEY) {
    logger.warn('HIBP API key not configured, using mock data');
    return getMockBreaches(email);
  }

  try {
    const response = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
      {
        headers: {
          'hibp-api-key': HIBP_API_KEY,
          'user-agent': 'TrustOS-BreachDetection',
        },
        params: {
          truncateResponse: false,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return []; // No breaches found
    }
    logger.error('HIBP API error', { error: error.message });
    return [];
  }
}

/**
 * Check if email was in any paste (using HIBP API)
 */
async function checkHIBPPastes(email: string): Promise<HIBPPaste[]> {
  if (!HIBP_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(
      `https://haveibeenpwned.com/api/v3/pastes/account/${encodeURIComponent(email)}`,
      {
        headers: {
          'hibp-api-key': HIBP_API_KEY,
          'user-agent': 'TrustOS-BreachDetection',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    logger.error('HIBP Paste API error', { error: error.message });
    return [];
  }
}

/**
 * Get all known breaches from HIBP
 */
async function getAllBreaches(): Promise<HIBPBreach[]> {
  if (!HIBP_API_KEY) {
    return getMockBreachDefinitions();
  }

  try {
    const response = await axios.get('https://haveibeenpwned.com/api/v3/breaches', {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'TrustOS-BreachDetection',
      },
    });

    return response.data;
  } catch (error) {
    logger.error('HIBP All Breaches API error', { error: String(error) });
    return getMockBreachDefinitions();
  }
}

// ============================================
// MOCK DATA (for development without API key)
// ============================================

function getMockBreaches(email: string): HIBPBreach[] {
  // Simulate some breaches based on email domain
  const domain = email.split('@')[1] || '';
  const breaches: HIBPBreach[] = [];

  if (domain.includes('example')) {
    breaches.push({
      Name: 'ExampleSite',
      Title: 'Example Site',
      Domain: 'example.com',
      BreachDate: '2023-01-15',
      AddedDate: '2023-02-01',
      ModifiedDate: '2023-02-01',
      PwnCount: 1234567,
      Description: 'Example site breach affecting millions of users.',
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Example.png',
      DataClasses: ['Email addresses', 'Names', 'Passwords'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      IsRetired: false,
      IsSpamList: false,
      IsMalware: false,
      IsSubscriptionFree: false,
    });
  }

  return breaches;
}

function getMockBreachDefinitions(): HIBPBreach[] {
  return [
    {
      Name: 'LinkedIn',
      Title: 'LinkedIn',
      Domain: 'linkedin.com',
      BreachDate: '2021-06-22',
      AddedDate: '2021-06-29',
      ModifiedDate: '2021-06-29',
      PwnCount: 700000000,
      Description: 'In June 2021, a data breach exposed 700M LinkedIn user records.',
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/LinkedIn.png',
      DataClasses: ['Email addresses', 'Phone numbers', 'Physical addresses', 'Names', 'Geospatial data'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      IsRetired: false,
      IsSpamList: false,
      IsMalware: false,
      IsSubscriptionFree: true,
    },
    {
      Name: 'Facebook',
      Title: 'Facebook',
      Domain: 'facebook.com',
      BreachDate: '2019-04-01',
      AddedDate: '2021-04-03',
      ModifiedDate: '2021-04-03',
      PwnCount: 533000000,
      Description: 'In April 2019, a massive Facebook data scrape was discovered.',
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Facebook.png',
      DataClasses: ['Email addresses', 'Facebook IDs', 'Full names', 'Locations', 'Phone numbers', 'Genders', 'Relationship statuses'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      IsRetired: false,
      IsSpamList: false,
      IsMalware: false,
      IsSubscriptionFree: true,
    },
  ];
}

// ============================================
// SERVICES
// ============================================

/**
 * Check email for breaches
 */
async function checkBreaches(email: string): Promise<{
  email: string;
  breached: boolean;
  breaches: any[];
  pasteCount: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastChecked: Date;
}> {
  const cleanEmail = email.toLowerCase().trim();

  // Check HIBP
  const breaches = await checkHIBPBreaches(cleanEmail);
  const pastes = await checkHIBPPastes(cleanEmail);

  // Save to database
  const record = await BreachRecord.findOneAndUpdate(
    { email: cleanEmail },
    {
      email: cleanEmail,
      breaches: breaches.map(b => ({
        name: b.Name,
        title: b.Title,
        domain: b.Domain,
        breachDate: new Date(b.BreachDate),
        addedDate: new Date(b.AddedDate),
        modifiedDate: new Date(b.ModifiedDate),
        pwnCount: b.PwnCount,
        description: b.Description,
        logoPath: b.LogoPath,
        dataClasses: b.DataClasses,
        isVerified: b.IsVerified,
        isFabricated: b.IsFabricated,
        isSensitive: b.IsSensitive,
        isRetired: b.IsRetired,
        isSpamList: b.IsSpamList,
        isMalware: b.IsMalware,
        isSubscriptionFree: b.IsSubscriptionFree,
      })),
      lastChecked: new Date(),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Calculate severity
  let severity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  if (breaches.length > 0) {
    const hasSensitiveData = breaches.some(b => b.DataClasses.some((d: string) =>
      ['Passwords', 'Credit cards', 'Bank account numbers', 'Social security numbers'].includes(d)
    ));
    const breachCount = breaches.length;

    if (hasSensitiveData || breachCount >= 5) {
      severity = 'critical';
    } else if (breachCount >= 3) {
      severity = 'high';
    } else if (breachCount >= 1) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
  }

  return {
    email: cleanEmail,
    breached: breaches.length > 0,
    breaches: breaches.map(b => ({
      name: b.Name,
      title: b.Title,
      domain: b.Domain,
      breachDate: b.BreachDate,
      pwnCount: b.PwnCount,
      dataClasses: b.DataClasses,
      description: b.Description,
    })),
    pasteCount: pastes.length,
    severity,
    lastChecked: record.lastChecked,
  };
}

/**
 * Check phone number for breaches (limited data available)
 */
async function checkPhoneBreaches(phone: string): Promise<{
  phone: string;
  breached: boolean;
  exposureLevel: string;
  sources: string[];
}> {
  const cleanPhone = phone.replace(/\D/g, '');

  // Phone number breaches are less common, but we can check for
  // known data broker exposures and SIM swap indicators

  // For now, return a basic check
  return {
    phone: cleanPhone,
    breached: false, // Would require integration with phone-specific services
    exposureLevel: 'unknown',
    sources: [],
  };
}

/**
 * Add item to monitoring
 */
async function addToMonitoring(data: {
  type: 'email' | 'phone' | 'domain';
  value: string;
  userId?: string;
  notifyEmail?: string;
  webhookUrl?: string;
}): Promise<{ success: boolean; monitorId: string }> {
  const monitor = new MonitoredItem({
    type: data.type,
    value: data.value,
    userId: data.userId,
    notifyEmail: data.notifyEmail,
    webhookUrl: data.webhookUrl,
    isActive: true,
  });

  await monitor.save();

  return {
    success: true,
    monitorId: monitor._id.toString(),
  };
}

/**
 * Get monitoring status
 */
async function getMonitoringStatus(value: string): Promise<{
  monitored: boolean;
  monitorId?: string;
  lastChecked?: Date;
  breachCount: number;
} | null> {
  const monitor = await MonitoredItem.findOne({ value, isActive: true });

  if (!monitor) {
    return null;
  }

  const breachRecord = await BreachRecord.findOne({ email: value.toLowerCase() });

  return {
    monitored: true,
    monitorId: monitor._id.toString(),
    lastChecked: breachRecord?.lastChecked,
    breachCount: breachRecord?.breaches.length || 0,
  };
}

/**
 * Get breach statistics
 */
async function getBreachStats(): Promise<{
  totalMonitored: number;
  totalBreached: number;
  totalBreaches: number;
  topBreaches: any[];
  recentBreaches: any[];
}> {
  const totalMonitored = await MonitoredItem.countDocuments({ isActive: true });
  const totalBreached = await BreachRecord.countDocuments({ 'breaches.0': { $exists: true } });

  // Get all unique breach names
  const allBreaches = await BreachRecord.aggregate([
    { $unwind: '$breaches' },
    { $group: { _id: '$breaches.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const recentBreaches = await BreachRecord.find({ 'breaches.0': { $exists: true } })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('email breaches');

  return {
    totalMonitored,
    totalBreached,
    totalBreaches: allBreaches.reduce((acc, b) => acc + b.count, 0),
    topBreaches: allBreaches,
    recentBreaches: recentBreaches.map(r => ({
      email: r.email,
      breachCount: r.breaches.length,
      latestBreach: r.breaches[0]?.name,
      lastChecked: r.updatedAt,
    })),
  };
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'breach-detection',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    hibpConfigured: !!HIBP_API_KEY,
  });
});

// Check email breaches
app.post('/check/email', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  try {
    const result = await checkBreaches(email);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Breach check error', { error: String(error) });
    res.status(500).json({ error: 'Failed to check breaches' });
  }
});

// Check phone breaches
app.post('/check/phone', async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  try {
    const result = await checkPhoneBreaches(phone);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Phone breach check error', { error: String(error) });
    res.status(500).json({ error: 'Failed to check phone breaches' });
  }
});

// Add to monitoring
app.post('/monitor', async (req: Request, res: Response) => {
  const { type, value, userId, notifyEmail, webhookUrl } = req.body;

  if (!type || !value) {
    res.status(400).json({ error: 'type and value are required' });
    return;
  }

  if (!['email', 'phone', 'domain'].includes(type)) {
    res.status(400).json({ error: 'type must be email, phone, or domain' });
    return;
  }

  try {
    const result = await addToMonitoring({ type, value, userId, notifyEmail, webhookUrl });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Monitor add error', { error: String(error) });
    res.status(500).json({ error: 'Failed to add monitoring' });
  }
});

// Get monitoring status
app.get('/monitor/:value', async (req: Request, res: Response) => {
  try {
    const result = await getMonitoringStatus(req.params.value);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Monitor status error', { error: String(error) });
    res.status(500).json({ error: 'Failed to get monitoring status' });
  }
});

// Get breach statistics
app.get('/stats', async (req: Request, res: Response) => {
  try {
    const result = await getBreachStats();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Stats error', { error: String(error) });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all known breaches
app.get('/breaches', async (req: Request, res: Response) => {
  try {
    const breaches = await getAllBreaches();
    res.json({ success: true, data: breaches });
  } catch (error) {
    logger.error('Breaches error', { error: String(error) });
    res.status(500).json({ error: 'Failed to get breaches' });
  }
});

// ============================================
// STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.startup(PORT, ['HIBP API', 'Breach Detection', 'Dark Web Monitoring']);
    });
  } catch (error) {
    logger.error('Failed to start', { error: String(error) });
    process.exit(1);
  }
}

start();

export default app;
