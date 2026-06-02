/**
 * TrustOS Scam Call Detection Service
 * Real-time call screening and scam identification
 *
 * Port: 4175
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4175', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scam_calls';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MONGODB MODELS
// ============================================

// Scam reports
const scamReportSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  callerType: { type: String, enum: ['scam', 'spam', 'telemarketing', 'unknown'], required: true },
  scamType: { type: String },
  reports: { type: Number, default: 1 },
  lastReported: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  communityReports: [{
    reporterId: String,
    reportedAt: { type: Date, default: Date.now },
    scamType: String,
  }],
});

const ScamReport = mongoose.model('ScamReport', scamReportSchema);

// Phone reputation
const phoneReputationSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  reputation: {
    score: { type: Number, default: 50 }, // 0-100, higher = more trustworthy
    level: { type: String, enum: ['trusted', 'neutral', 'suspicious', 'dangerous'], default: 'neutral' },
  },
  stats: {
    totalCalls: { type: Number, default: 0 },
    spamCalls: { type: Number, default: 0 },
    scamCalls: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
  },
  flags: [{
    type: { type: String },
    reason: String,
    firstSeen: { type: Date, default: Date.now },
    count: { type: Number, default: 1 },
  }],
  metadata: {
    carrier: String,
    isVirtual: { type: Boolean, default: false },
    isTollFree: { type: Boolean, default: false },
    country: { type: String, default: 'IN' },
    lastChecked: { type: Date },
  },
  firstSeen: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

const PhoneReputation = mongoose.model('PhoneReputation', phoneReputationSchema);

// ============================================
// SCAM PATTERNS
// ============================================

const SCAM_KEYWORDS = [
  'bank', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'kotak',
  'verify', 'kyc', 'update', 'account', 'blocked', 'suspended',
  'otp', 'password', 'card', 'debit', 'credit',
  'win', 'prize', 'lottery', 'reward', 'gift',
  'invest', 'return', 'double', 'guaranteed',
  'job', 'work from home', 'salary', 'interview',
  'court', 'legal', 'arrest', 'warrant', 'police',
];

// Suspicious number patterns
const SUSPICIOUS_PATTERNS = [
  { pattern: /^(91){0,1}9999999999$/, reason: 'Repeated digit number' },
  { pattern: /^(91){0,1}0000000000$/, reason: 'All zeros number' },
  { pattern: /^1[2-9]\d{9}$/, reason: 'Format anomaly' },
];

// ============================================
// SERVICES
// ============================================

/**
 * Check phone reputation
 */
async function checkPhoneReputation(phone: string): Promise<{
  phone: string;
  reputation: {
    score: number;
    level: string;
    isSpam: boolean;
    isScam: boolean;
  };
  stats: {
    reports: number;
    scamCalls: number;
    spamCalls: number;
  };
  flags: string[];
  callerType?: string;
  scamType?: string;
}> {
  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, '');

  // Check suspicious patterns
  const flags: string[] = [];
  for (const { pattern, reason } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(cleanPhone)) {
      flags.push(reason);
    }
  }

  // Get or create reputation
  let rep = await PhoneReputation.findOne({ phone: cleanPhone });

  if (!rep) {
    rep = new PhoneReputation({
      phone: cleanPhone,
      metadata: {
        isTollFree: cleanPhone.startsWith('1800') || cleanPhone.startsWith('1866'),
        isVirtual: cleanPhone.startsWith('91'),
        country: 'IN',
        lastChecked: new Date(),
      },
    });
    await rep.save();
  }

  // Update last checked
  rep.metadata.lastChecked = new Date();
  rep.stats.totalCalls++;
  await rep.save();

  // Determine level
  let level = 'neutral';
  let isSpam = false;
  let isScam = false;

  if (rep.stats.reports >= 10 || rep.stats.scamCalls >= 5) {
    level = 'dangerous';
    isScam = true;
  } else if (rep.stats.reports >= 5 || rep.stats.scamCalls >= 2) {
    level = 'suspicious';
    isSpam = true;
  } else if (rep.stats.reports >= 1) {
    level = 'suspicious';
  }

  // Calculate score (inverse of reports)
  const score = Math.max(0, 100 - (rep.stats.reports * 10) - (rep.stats.scamCalls * 15));

  return {
    phone: cleanPhone,
    reputation: {
      score,
      level,
      isSpam,
      isScam,
    },
    stats: {
      reports: rep.stats.reports,
      scamCalls: rep.stats.scamCalls,
      spamCalls: rep.stats.spamCalls,
    },
    flags: [...flags, ...rep.flags.map(f => f.reason)],
    callerType: isScam ? 'scam' : isSpam ? 'spam' : undefined,
    scamType: isScam ? 'telecom_scam' : undefined,
  };
}

/**
 * Report scam call
 */
async function reportScam(data: {
  phone: string;
  reporterId?: string;
  scamType?: string;
  callerType: 'scam' | 'spam' | 'telemarketing';
  description?: string;
}): Promise<{
  success: boolean;
  reportId: string;
  newReputation: any;
}> {
  const cleanPhone = data.phone.replace(/\D/g, '');

  // Update or create scam report
  let report = await ScamReport.findOne({ phone: cleanPhone, callerType: data.callerType });

  if (report) {
    report.reports++;
    report.lastReported = new Date();
    report.communityReports.push({
      reporterId: data.reporterId || 'anonymous',
      reportedAt: new Date(),
      scamType: data.scamType,
    });
  } else {
    report = new ScamReport({
      phone: cleanPhone,
      callerType: data.callerType,
      scamType: data.scamType,
      reports: 1,
      communityReports: [{
        reporterId: data.reporterId || 'anonymous',
        reportedAt: new Date(),
        scamType: data.scamType,
      }],
    });
  }

  await report.save();

  // Update reputation
  let rep = await PhoneReputation.findOne({ phone: cleanPhone });

  if (!rep) {
    rep = new PhoneReputation({ phone: cleanPhone });
  }

  rep.stats.reports++;
  rep.lastUpdated = new Date();

  if (data.callerType === 'scam') {
    rep.stats.scamCalls++;
  } else if (data.callerType === 'spam') {
    rep.stats.spamCalls++;
  }

  // Add flag
  const existingFlag = rep.flags.find(f => f.type === data.callerType);
  if (existingFlag) {
    existingFlag.count++;
  } else {
    rep.flags.push({
      type: data.callerType,
      reason: data.description || `${data.callerType} reported`,
      count: 1,
    });
  }

  await rep.save();

  return {
    success: true,
    reportId: report._id.toString(),
    newReputation: {
      score: Math.max(0, 100 - (rep.stats.reports * 10) - (rep.stats.scamCalls * 15)),
      level: rep.stats.reports >= 10 ? 'dangerous' : rep.stats.reports >= 5 ? 'suspicious' : 'neutral',
    },
  };
}

/**
 * Search phone
 */
async function searchPhone(phone: string): Promise<{
  found: boolean;
  reputation?: any;
  reports?: any[];
}> {
  const cleanPhone = phone.replace(/\D/g, '');

  const rep = await PhoneReputation.findOne({ phone: cleanPhone });
  const reports = await ScamReport.find({ phone: cleanPhone }).limit(5);

  return {
    found: !!rep || reports.length > 0,
    reputation: rep ? {
      score: Math.max(0, 100 - (rep.stats.reports * 10) - (rep.stats.scamCalls * 15)),
      level: rep.stats.reports >= 10 ? 'dangerous' : rep.stats.reports >= 5 ? 'suspicious' : 'neutral',
      stats: rep.stats,
      flags: rep.flags.map(f => f.reason),
    } : undefined,
    reports: reports.map(r => ({
      callerType: r.callerType,
      scamType: r.scamType,
      reports: r.reports,
      lastReported: r.lastReported,
      verified: r.verified,
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
    service: 'scam-call-detection',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Check phone reputation
app.post('/call/check', async (req: Request, res: Response) => {
  const { phone, userId } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'phone is required' });
    return;
  }

  try {
    const result = await checkPhoneReputation(phone);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Phone check error:', error);
    res.status(500).json({ error: 'Failed to check phone' });
  }
});

// Report scam call
app.post('/call/report', async (req: Request, res: Response) => {
  const { phone, reporterId, scamType, callerType, description } = req.body;

  if (!phone || !callerType) {
    res.status(400).json({ error: 'phone and callerType are required' });
    return;
  }

  try {
    const result = await reportScam({
      phone,
      reporterId,
      scamType,
      callerType,
      description,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to report scam' });
  }
});

// Search phone
app.get('/call/search/:phone', async (req: Request, res: Response) => {
  try {
    const result = await searchPhone(req.params.phone);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search phone' });
  }
});

// Get caller ID info (for call screening)
app.post('/call/caller-id', async (req: Request, res: Response) => {
  const { phone } = req.body;

  try {
    const reputation = await checkPhoneReputation(phone);

    // Generate caller ID response
    const callerId = {
      phone: reputation.phone,
      displayName: null, // Would be populated from directory
      verified: reputation.reputation.level === 'trusted',
      tags: [
        reputation.reputation.isScam ? 'SCAM' : null,
        reputation.reputation.isSpam ? 'SPAM' : null,
        reputation.flags.includes('Toll-free') ? 'TOLL_FREE' : null,
      ].filter(Boolean),
      riskLevel: reputation.reputation.level,
      riskScore: reputation.reputation.score,
      communityRating: reputation.stats.reports > 0 ? {
        total: reputation.stats.reports,
        scam: reputation.stats.scamCalls,
        spam: reputation.stats.spamCalls,
      } : null,
      shouldBlock: reputation.reputation.isScam || reputation.reputation.score < 20,
      shouldWarn: reputation.reputation.isSpam || reputation.reputation.score < 50,
    };

    res.json({
      success: true,
      data: callerId,
    });
  } catch (error) {
    console.error('Caller ID error:', error);
    res.status(500).json({ error: 'Failed to get caller ID' });
  }
});

// Get spam statistics
app.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalReports = await ScamReport.countDocuments();
    const scamReports = await ScamReport.countDocuments({ callerType: 'scam' });
    const spamReports = await ScamReport.countDocuments({ callerType: 'spam' });
    const dangerousPhones = await PhoneReputation.countDocuments({
      'reputation.level': 'dangerous'
    });

    res.json({
      success: true,
      data: {
        totalReports,
        scamReports,
        spamReports,
        dangerousPhones,
        topScamTypes: await ScamReport.aggregate([
          { $group: { _id: '$scamType', count: { $sum: '$reports' } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
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
╔══════════════════════════════════════════════╗
║     TrustOS Scam Call Detection Service   ║
╠══════════════════════════════════════════════╣
║  Status:    RUNNING                      ║
║  Port:      ${PORT}                            ║
║  Database:  MongoDB connected           ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
