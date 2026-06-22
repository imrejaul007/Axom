/**
 * TrustOS Policy Engine Service
 * Convert policies to machine-readable rules
 *
 * Port: 4181
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { PolicyParser, policyParser } from './parser.js';
import { RuleRegistry, ruleRegistry } from './registry.js';
import type {
  PolicyParseRequest,
  PolicyValidationRequest,
  PolicyValidationResult,
  PolicyViolation,
} from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4181', 10);

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
    service: 'policy-engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// POLICY MANAGEMENT
// ============================================

/**
 * POST /policy/parse
 * Parse policy document and extract rules
 */
app.post('/policy/parse', (req: Request, res: Response) => {
  try {
    const request: PolicyParseRequest = req.body;

    if (!request.name || !request.content) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name and content are required',
        },
      });
      return;
    }

    const result = policyParser.parse(request);

    if (result.success && result.policy) {
      ruleRegistry.addPolicy(result.policy);
    }

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse policy',
      },
    });
  }
});

/**
 * GET /policies
 * List all policies
 */
app.get('/policies', (req: Request, res: Response) => {
  const { type } = req.query;

  let policies = ruleRegistry.getAllPolicies();
  if (type) {
    policies = policies.filter(p => p.type === type);
  }

  res.json({
    success: true,
    data: {
      policies,
      total: policies.length,
    },
  });
});

/**
 * GET /policies/:id
 * Get policy by ID
 */
app.get('/policies/:id', (req: Request, res: Response) => {
  const policy = ruleRegistry.getPolicy(req.params.id);

  if (!policy) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Policy not found',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: policy,
  });
});

/**
 * DELETE /policies/:id
 * Delete policy
 */
app.delete('/policies/:id', (req: Request, res: Response) => {
  const deleted = ruleRegistry.deletePolicy(req.params.id);

  res.json({
    success: deleted,
    data: { deleted },
  });
});

// ============================================
// RULE MANAGEMENT
// ============================================

/**
 * GET /rules
 * List all rules
 */
app.get('/rules', (req: Request, res: Response) => {
  const { policyId, type, enabled } = req.query;

  let rules = ruleRegistry.getAllRules();

  if (policyId) {
    rules = rules.filter(r => r.policyId === policyId);
  }
  if (type) {
    rules = rules.filter(r => r.type === type);
  }
  if (enabled !== undefined) {
    rules = rules.filter(r => r.enabled === (enabled === 'true'));
  }

  res.json({
    success: true,
    data: {
      rules,
      total: rules.length,
    },
  });
});

/**
 * GET /rules/:id
 * Get rule by ID
 */
app.get('/rules/:id', (req: Request, res: Response) => {
  const rule = ruleRegistry.getRule(req.params.id);

  if (!rule) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Rule not found',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: rule,
  });
});

/**
 * PATCH /rules/:id
 * Update rule
 */
app.patch('/rules/:id', (req: Request, res: Response) => {
  const rule = ruleRegistry.updateRule(req.params.id, req.body);

  if (!rule) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Rule not found',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: rule,
  });
});

/**
 * POST /rules/:id/enable
 * Enable rule
 */
app.post('/rules/:id/enable', (req: Request, res: Response) => {
  const success = ruleRegistry.enableRule(req.params.id);

  res.json({
    success,
    data: { ruleId: req.params.id, enabled: success },
  });
});

/**
 * POST /rules/:id/disable
 * Disable rule
 */
app.post('/rules/:id/disable', (req: Request, res: Response) => {
  const success = ruleRegistry.disableRule(req.params.id);

  res.json({
    success,
    data: { ruleId: req.params.id, enabled: !success },
  });
});

/**
 * DELETE /rules/:id
 * Delete rule
 */
app.delete('/rules/:id', (req: Request, res: Response) => {
  const deleted = ruleRegistry.deleteRule(req.params.id);

  res.json({
    success: deleted,
    data: { deleted },
  });
});

/**
 * GET /rules/search
 * Search rules
 */
app.get('/rules/search', (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query parameter q is required',
      },
    });
    return;
  }

  const rules = ruleRegistry.searchRules(q as string);

  res.json({
    success: true,
    data: {
      rules,
      total: rules.length,
      query: q,
    },
  });
});

// ============================================
// VALIDATION
// ============================================

/**
 * POST /validate
 * Validate content against policies
 */
app.post('/validate', (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const request: PolicyValidationRequest = req.body;

    if (!request.content) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'content is required',
        },
      });
      return;
    }

    // Get rules to validate against
    let rules = ruleRegistry.getEnabledRules();
    if (request.policies && request.policies.length > 0) {
      rules = rules.filter(r => request.policies.includes(r.policyId));
    }

    // Check content against rules
    const violations: PolicyViolation[] = [];
    const contentLower = request.content.toLowerCase();

    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        const patternLower = pattern.toLowerCase();
        if (contentLower.includes(patternLower)) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            policyId: rule.policyId,
            policyName: ruleRegistry.getPolicy(rule.policyId)?.name || 'Unknown',
            matchedText: pattern,
            severity: rule.severity,
            action: rule.action,
            suggestion: `Review compliance with ${rule.name}`,
          });
        }
      }
    }

    // Calculate risk score
    let riskScore = 0;
    for (const v of violations) {
      switch (v.severity) {
        case 'critical': riskScore += 40; break;
        case 'high': riskScore += 25; break;
        case 'medium': riskScore += 15; break;
        case 'low': riskScore += 5; break;
      }
    }
    riskScore = Math.min(100, riskScore);

    const result: PolicyValidationResult = {
      content: request.content,
      violations,
      passed: violations.length === 0 || !violations.some(v => v.action === 'block'),
      riskScore,
      checkedPolicies: request.policies || ruleRegistry.getAllPolicies().map(p => p.id),
      checkedAt: new Date(),
    };

    res.json({
      success: true,
      data: result,
      meta: {
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate content',
      },
    });
  }
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get registry statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ruleRegistry.getStatistics(),
  });
});

// ============================================
// EXPORT/IMPORT
// ============================================

/**
 * GET /export
 * Export all rules
 */
app.get('/export', (req: Request, res: Response) => {
  const data = ruleRegistry.exportRules();
  res.json({
    success: true,
    data,
  });
});

/**
 * POST /import
 * Import rules
 */
app.post('/import', (req: Request, res: Response) => {
  const { policies, rules } = req.body;

  if (!policies || !rules) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'policies and rules arrays are required',
      },
    });
    return;
  }

  const result = ruleRegistry.importRules({ policies, rules });

  res.json({
    success: true,
    data: result,
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
  logger.info(
╔══════════════════════════════════════════════════════════╗
║           TrustOS Policy Engine Service                 ║
╠══════════════════════════════════════════════════════════╣
║  Status:      RUNNING                              ║
║  Port:        ${PORT}                                    ║
║  Version:     1.0.0                               ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║  POST /policy/parse   - Parse policy document        ║
║  GET  /policies       - List policies              ║
║  GET  /rules          - List rules                  ║
║  POST /validate       - Validate content             ║
║  GET  /stats          - Get statistics             ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
