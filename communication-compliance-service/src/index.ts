/**
 * TrustOS Communication Compliance Service
 * Pre-send validation for all communications
 *
 * Port: 4180
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { ContentValidator, contentValidator } from './validator.js';
import { RuleEngine, ruleEngine } from './ruleEngine.js';
import type {
  ComplianceCheckRequest,
  ValidationResponse,
  Regulation,
} from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4180', 10);

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
    logger.info([${requestId}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
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
    service: 'communication-compliance',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// VALIDATION ENDPOINTS
// ============================================

/**
 * POST /validate
 * Validate content for compliance
 */
app.post('/validate', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    const request: ComplianceCheckRequest = req.body;

    // Validate request
    if (!request.content || !request.channel) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'content and channel are required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTimeMs: Date.now() - startTime,
        },
      });
      return;
    }

    // Validate content
    const result = await contentValidator.validate(request);

    const response: ValidationResponse = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate content',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  }
});

/**
 * POST /validate/email
 * Quick email validation
 */
app.post('/validate/email', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    const { content, sender, recipient, userId } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const result = await contentValidator.validate({
      content,
      channel: 'email',
      contentType: 'html',
      sender,
      recipient,
      userId,
    });

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Email validation error:', error);
    res.status(500).json({ error: 'Failed to validate email' });
  }
});

/**
 * POST /validate/linkedin
 * Quick LinkedIn post validation
 */
app.post('/validate/linkedin', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    const { content, userId } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const result = await contentValidator.validate({
      content,
      channel: 'linkedin',
      contentType: 'text',
      userId,
    });

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('LinkedIn validation error:', error);
    res.status(500).json({ error: 'Failed to validate LinkedIn content' });
  }
});

/**
 * POST /validate/document
 * Document validation
 */
app.post('/validate/document', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    const { content, userId } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const result = await contentValidator.validate({
      content,
      channel: 'document',
      contentType: 'text',
      userId,
    });

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Document validation error:', error);
    res.status(500).json({ error: 'Failed to validate document' });
  }
});

/**
 * POST /validate/batch
 * Batch validation
 */
app.post('/validate/batch', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: 'items array is required' });
      return;
    }

    if (items.length > 100) {
      res.status(400).json({ error: 'Maximum 100 items per batch' });
      return;
    }

    const results = await Promise.all(
      items.map(async (item: ComplianceCheckRequest) => {
        return contentValidator.validate(item);
      })
    );

    res.json({
      success: true,
      data: {
        results,
        total: items.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Batch validation error:', error);
    res.status(500).json({ error: 'Failed to validate batch' });
  }
});

// ============================================
// RULE MANAGEMENT
// ============================================

/**
 * GET /rules
 * Get all rules
 */
app.get('/rules', (req: Request, res: Response) => {
  const { regulation } = req.query;

  let rules = ruleEngine.getRules();
  if (regulation) {
    rules = rules.filter(r => r.regulation === regulation);
  }

  res.json({
    success: true,
    data: {
      rules,
      total: rules.length,
      byRegulation: {
        SEC: rules.filter(r => r.regulation === 'SEC').length,
        FINRA: rules.filter(r => r.regulation === 'FINRA').length,
        RBI: rules.filter(r => r.regulation === 'RBI').length,
        COMPANY_POLICY: rules.filter(r => r.regulation === 'COMPANY_POLICY').length,
      },
    },
  });
});

/**
 * POST /rules
 * Add custom rule
 */
app.post('/rules', (req: Request, res: Response) => {
  try {
    const rule = req.body;

    if (!rule.name || !rule.patterns || !rule.regulation) {
      res.status(400).json({
        error: 'name, patterns, and regulation are required',
      });
      return;
    }

    const newRule = ruleEngine.addRule({
      name: rule.name,
      description: rule.description || '',
      regulation: rule.regulation as Regulation,
      severity: rule.severity || 'medium',
      action: rule.action || 'warn',
      patterns: rule.patterns,
      enabled: true,
    });

    res.json({
      success: true,
      data: newRule,
    });
  } catch (error) {
    console.error('Add rule error:', error);
    res.status(500).json({ error: 'Failed to add rule' });
  }
});

/**
 * DELETE /rules/:id
 * Delete rule
 */
app.delete('/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = ruleEngine.removeRule(id);

  res.json({
    success: deleted,
    data: { deleted },
  });
});

/**
 * PATCH /rules/:id
 * Enable/disable rule
 */
app.patch('/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled } = req.body;

  let success = false;
  if (enabled !== undefined) {
    success = enabled ? ruleEngine.enableRule(id) : ruleEngine.disableRule(id);
  }

  res.json({
    success,
    data: { id, enabled },
  });
});

/**
 * GET /regulations
 * Get enabled regulations
 */
app.get('/regulations', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      enabled: ruleEngine.getEnabledRegulations(),
      available: ['SEC', 'FINRA', 'RBI', 'COMPANY_POLICY', 'GDPR', 'HIPAA'],
    },
  });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get validation statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      rulesEnabled: ruleEngine.getRules().length,
      regulationsEnabled: ruleEngine.getEnabledRegulations(),
      serviceStatus: 'operational',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
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
  logger.info(
╔══════════════════════════════════════════════════════════╗
║     TrustOS Communication Compliance Service            ║
╠══════════════════════════════════════════════════════════╣
║  Status:      RUNNING                              ║
║  Port:        ${PORT}                                    ║
║  Version:     1.0.0                               ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║  POST /validate          - Full validation          ║
║  POST /validate/email    - Quick email check       ║
║  POST /validate/linkedin - Quick LinkedIn check    ║
║  POST /validate/document  - Document check          ║
║  POST /validate/batch    - Batch validation       ║
║  GET  /rules             - List all rules         ║
║  POST /rules              - Add custom rule        ║
║  GET  /health            - Health check            ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
