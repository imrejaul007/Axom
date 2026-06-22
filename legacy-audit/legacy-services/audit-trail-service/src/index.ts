/**
 * TrustOS Audit Trail Service
 * Complete compliance logging
 *
 * Port: 4185
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import type { AuditEvent, AuditQuery, AuditEventType, ComplianceSummary } from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4185', 10);

// In-memory store (would be database in production)
const auditLog: AuditEvent[] = [];

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'audit-trail',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// LOGGING
// ============================================

/**
 * POST /log
 * Log an audit event
 */
app.post('/log', (req: Request, res: Response) => {
  const event: AuditEvent = {
    ...req.body,
    id: req.body.id || uuidv4(),
    timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
  };

  auditLog.push(event);

  // Keep only last 50000 events
  if (auditLog.length > 50000) {
    auditLog.splice(0, auditLog.length - 50000);
  }

  res.json({
    success: true,
    data: { id: event.id },
  });
});

/**
 * POST /log/batch
 * Log multiple events
 */
app.post('/log/batch', (req: Request, res: Response) => {
  const { events } = req.body;

  if (!events || !Array.isArray(events)) {
    res.status(400).json({ error: 'events array required' });
    return;
  }

  const ids: string[] = [];
  for (const event of events) {
    const id = uuidv4();
    auditLog.push({
      ...event,
      id,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    });
    ids.push(id);
  }

  res.json({
    success: true,
    data: { ids, count: ids.length },
  });
});

// ============================================
// QUERYING
// ============================================

/**
 * GET /logs
 * Query audit logs
 */
app.get('/logs', (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    types,
    actorIds,
    actorTypes,
    outcomes,
    search,
    limit = 100,
    offset = 0,
  } = req.query;

  let results = [...auditLog].reverse();

  // Filter by date
  if (startDate) {
    const start = new Date(startDate as string);
    results = results.filter(e => e.timestamp >= start);
  }
  if (endDate) {
    const end = new Date(endDate as string);
    results = results.filter(e => e.timestamp <= end);
  }

  // Filter by type
  if (types) {
    const typeList = (types as string).split(',');
    results = results.filter(e => typeList.includes(e.type));
  }

  // Filter by actor
  if (actorIds) {
    const idList = (actorIds as string).split(',');
    results = results.filter(e => idList.includes(e.actor.id));
  }
  if (actorTypes) {
    const typeList = (actorTypes as string).split(',') as ('user' | 'agent' | 'system')[];
    results = results.filter(e => typeList.includes(e.actor.type));
  }

  // Filter by outcome
  if (outcomes) {
    const outcomeList = (outcomes as string).split(',') as ('success' | 'failure' | 'blocked')[];
    results = results.filter(e => outcomeList.includes(e.outcome));
  }

  // Search
  if (search) {
    const searchLower = (search as string).toLowerCase();
    results = results.filter(e =>
      e.action.toLowerCase().includes(searchLower) ||
      JSON.stringify(e.details).toLowerCase().includes(searchLower)
    );
  }

  const total = results.length;
  results = results.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    data: {
      events: results,
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * GET /logs/:id
 * Get single log entry
 */
app.get('/logs/:id', (req: Request, res: Response) => {
  const event = auditLog.find(e => e.id === req.params.id);

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json({ success: true, data: event });
});

// ============================================
// REPORTS
// ============================================

/**
 * GET /reports/compliance
 * Get compliance summary
 */
app.get('/reports/compliance', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  let results = [...auditLog];

  if (startDate) {
    const start = new Date(startDate as string);
    results = results.filter(e => e.timestamp >= start);
  }
  if (endDate) {
    const end = new Date(endDate as string);
    results = results.filter(e => e.timestamp <= end);
  }

  // Calculate summary
  const summary: ComplianceSummary = {
    period: {
      start: startDate ? new Date(startDate as string) : results[results.length - 1]?.timestamp || new Date(),
      end: endDate ? new Date(endDate as string) : new Date(),
    },
    totalChecks: results.filter(e => e.type === 'compliance_check').length,
    passedChecks: results.filter(e => e.type === 'compliance_check' && e.outcome === 'success').length,
    failedChecks: results.filter(e => e.type === 'compliance_check' && e.outcome === 'failure').length,
    blockedActions: results.filter(e => e.outcome === 'blocked').length,
    violationsByRegulation: {},
    topViolations: [],
    riskScore: 0,
  };

  // Count violations by regulation
  for (const event of results) {
    if (event.violations) {
      for (const v of event.violations) {
        summary.violationsByRegulation[v.regulation] = (summary.violationsByRegulation[v.regulation] || 0) + 1;
      }
    }
  }

  // Calculate risk score
  const violations = results.filter(e => e.violations && e.violations.length > 0);
  const maxRiskScore = violations.reduce((max, e) => Math.max(max, e.riskScore || 0), 0);
  summary.riskScore = Math.round((violations.length / Math.max(results.length, 1)) * 100);

  // Top violations
  const violationCount: Record<string, number> = {};
  for (const event of violations) {
    for (const v of event.violations || []) {
      violationCount[v.ruleName] = (violationCount[v.ruleName] || 0) + 1;
    }
  }
  summary.topViolations = Object.entries(violationCount)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({ success: true, data: summary });
});

/**
 * GET /reports/activity
 * Get activity report
 */
app.get('/reports/activity', (req: Request, res: Response) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  let results = [...auditLog];

  if (startDate) {
    const start = new Date(startDate as string);
    results = results.filter(e => e.timestamp >= start);
  }
  if (endDate) {
    const end = new Date(endDate as string);
    results = results.filter(e => e.timestamp <= end);
  }

  // Group by time period
  const groups: Record<string, number> = {};
  for (const event of results) {
    const date = event.timestamp;
    let key: string;

    switch (groupBy) {
      case 'hour':
        key = `${date.toISOString().slice(0, 13)}:00`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }

    groups[key] = (groups[key] || 0) + 1;
  }

  const timeline = Object.entries(groups)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // By type
  const byType: Record<string, number> = {};
  for (const event of results) {
    byType[event.type] = (byType[event.type] || 0) + 1;
  }

  // By outcome
  const byOutcome: Record<string, number> = {};
  for (const event of results) {
    byOutcome[event.outcome] = (byOutcome[event.outcome] || 0) + 1;
  }

  res.json({
    success: true,
    data: {
      total: results.length,
      timeline,
      byType,
      byOutcome,
    },
  });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get audit statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const total = auditLog.length;
  const byType: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};

  for (const event of auditLog) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    byOutcome[event.outcome] = (byOutcome[event.outcome] || 0) + 1;
  }

  res.json({
    success: true,
    data: {
      total,
      byType,
      byOutcome,
      oldestEvent: auditLog[0]?.timestamp,
      newestEvent: auditLog[auditLog.length - 1]?.timestamp,
    },
  });
});

// ============================================
// STARTUP
// ============================================

app.listen(PORT, () => {
  logger.info(
╔══════════════════════════════════════════════════════════╗
║              TrustOS Audit Trail Service                ║
╠══════════════════════════════════════════════════════════╣
║  Status:      RUNNING                              ║
║  Port:        ${PORT}                                    ║
║  Version:     1.0.0                               ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║  POST /log         - Log event                    ║
║  GET  /logs        - Query logs                   ║
║  GET  /reports/compliance - Compliance report     ║
║  GET  /reports/activity - Activity report        ║
║  GET  /stats      - Statistics                   ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
