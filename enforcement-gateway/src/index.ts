/**
 * TrustOS Enforcement Gateway
 * Real-time pre-send validation and enforcement
 *
 * Port: 4182
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { Enforcer, enforcer } from './enforcer.js';
import { QuarantineQueue, quarantineQueue } from './quarantine.js';
import { RuleCache, ruleCache } from './cache.js';
import type { EnforcementRequest, EnforcementMode } from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4182', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;

  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${requestId}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });

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
    service: 'enforcement-gateway',
    version: '1.0.0',
    mode: enforcer.getMode(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ENFORCEMENT
// ============================================

/**
 * POST /enforce/pre-send
 * Real-time pre-send validation
 */
app.post('/enforce/pre-send', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;

  try {
    const request: EnforcementRequest = {
      ...req.body,
      id: req.body.id || uuidv4(),
      timestamp: new Date(),
    };

    // Validate request
    if (!request.content || !request.channel) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'content and channel are required',
        },
      });
      return;
    }

    // Enforce content
    const result = await enforcer.enforce(request);

    res.json({
      success: true,
      data: result,
      meta: {
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Enforcement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENFORCEMENT_ERROR',
        message: 'Failed to enforce content',
      },
    });
  }
});

/**
 * POST /enforce/email
 * Quick email enforcement
 */
app.post('/enforce/email', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;

  try {
    const { content, sender, recipient } = req.body;

    const request: EnforcementRequest = {
      id: uuidv4(),
      content,
      channel: 'email',
      sender: sender || { id: 'unknown', type: 'user' },
      recipient,
      timestamp: new Date(),
    };

    const result = await enforcer.enforce(request);

    res.json({
      success: true,
      data: result,
      meta: {
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Email enforcement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENFORCEMENT_ERROR',
        message: 'Failed to enforce email',
      },
    });
  }
});

/**
 * POST /enforce/agent
 * Agent action enforcement
 */
app.post('/enforce/agent', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;

  try {
    const { content, agentId, action, recipient } = req.body;

    const request: EnforcementRequest = {
      id: uuidv4(),
      content,
      channel: 'api',
      sender: {
        id: agentId,
        type: 'agent',
        name: `Agent ${agentId}`,
      },
      recipient,
      context: { agentId, action },
      timestamp: new Date(),
    };

    const result = await enforcer.enforce(request);

    res.json({
      success: true,
      data: result,
      meta: {
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Agent enforcement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENFORCEMENT_ERROR',
        message: 'Failed to enforce agent action',
      },
    });
  }
});

// ============================================
// MODE MANAGEMENT
// ============================================

/**
 * GET /mode
 * Get current enforcement mode
 */
app.get('/mode', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      mode: enforcer.getMode(),
      availableModes: ['blocking', 'advisory', 'audit'],
    },
  });
});

/**
 * POST /mode
 * Set enforcement mode
 */
app.post('/mode', (req: Request, res: Response) => {
  const { mode } = req.body as { mode: EnforcementMode };

  if (!['blocking', 'advisory', 'audit'].includes(mode)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MODE',
        message: 'Mode must be blocking, advisory, or audit',
      },
    });
    return;
  }

  enforcer.setMode(mode);

  res.json({
    success: true,
    data: { mode },
  });
});

// ============================================
// QUARANTINE MANAGEMENT
// ============================================

/**
 * GET /quarantine
 * Get pending quarantine items
 */
app.get('/quarantine', (req: Request, res: Response) => {
  const { status } = req.query;

  let items;
  if (status) {
    items = quarantineQueue.getByStatus(status as any);
  } else {
    items = quarantineQueue.getPending();
  }

  res.json({
    success: true,
    data: {
      items,
      stats: quarantineQueue.getStats(),
    },
  });
});

/**
 * GET /quarantine/:id
 * Get quarantine item
 */
app.get('/quarantine/:id', (req: Request, res: Response) => {
  const item = quarantineQueue.get(req.params.id);

  if (!item) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Quarantine item not found',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: item,
  });
});

/**
 * POST /quarantine/:id/approve
 * Approve quarantine item
 */
app.post('/quarantine/:id/approve', (req: Request, res: Response) => {
  const { reviewedBy, notes } = req.body;

  const success = quarantineQueue.approve(req.params.id, reviewedBy || 'system', notes);

  res.json({
    success,
    data: { id: req.params.id, action: 'approved' },
  });
});

/**
 * POST /quarantine/:id/reject
 * Reject quarantine item
 */
app.post('/quarantine/:id/reject', (req: Request, res: Response) => {
  const { reviewedBy, notes } = req.body;

  const success = quarantineQueue.reject(req.params.id, reviewedBy || 'system', notes);

  res.json({
    success,
    data: { id: req.params.id, action: 'rejected' },
  });
});

/**
 * POST /quarantine/:id/modify
 * Modify and approve quarantine item
 */
app.post('/quarantine/:id/modify', (req: Request, res: Response) => {
  const { modifiedContent, reviewedBy, notes } = req.body;

  if (!modifiedContent) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'modifiedContent is required',
      },
    });
    return;
  }

  const success = quarantineQueue.modify(
    req.params.id,
    modifiedContent,
    reviewedBy || 'system',
    notes
  );

  res.json({
    success,
    data: { id: req.params.id, action: 'modified' },
  });
});

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * POST /cache/refresh
 * Refresh rule cache
 */
app.post('/cache/refresh', (req: Request, res: Response) => {
  // In a real implementation, this would fetch fresh rules from database
  ruleCache.clear();

  res.json({
    success: true,
    data: { message: 'Cache refreshed' },
  });
});

/**
 * GET /cache/stats
 * Get cache statistics
 */
app.get('/cache/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ruleCache.getStats(),
  });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get enforcement statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      mode: enforcer.getMode(),
      quarantine: quarantineQueue.getStats(),
      cache: ruleCache.getStats(),
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
});

// ============================================
// STARTUP
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          TrustOS Enforcement Gateway                   ║
╠══════════════════════════════════════════════════════════╣
║  Status:      RUNNING                              ║
║  Port:        ${PORT}                                    ║
║  Version:     1.0.0                               ║
║  Mode:        blocking                            ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║  POST /enforce/pre-send  - Real-time validation    ║
║  POST /enforce/email     - Email enforcement        ║
║  POST /enforce/agent     - Agent action enforcement ║
║  GET  /quarantine        - Pending items             ║
║  POST /quarantine/:id/approve - Approve item      ║
║  POST /quarantine/:id/reject  - Reject item       ║
║  GET  /mode             - Get enforcement mode    ║
║  POST /mode              - Set enforcement mode   ║
║  GET  /stats             - Statistics             ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
