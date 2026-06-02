/**
 * TrustOS LLM Compliance Service
 * Validate AI-generated content
 *
 * Port: 4183
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { ContentValidators, validators } from './validators.js';
import type {
  LLMValidationRequest,
  LLMValidationResult,
  LLMIssue,
} from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4183', 10);

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
    service: 'llm-compliance',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// VALIDATION ENDPOINTS
// ============================================

/**
 * POST /validate
 * Validate LLM-generated content
 */
app.post('/validate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;

  try {
    const request: LLMValidationRequest = req.body;

    // Validate request
    if (!request.content || !request.source || !request.contentType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'content, source, and contentType are required',
        },
      });
      return;
    }

    const result = await validateContent(request, startTime);

    res.json({
      success: true,
      data: result,
      meta: {
        requestId,
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

/**
 * POST /validate/quick
 * Quick validation (regulatory only)
 */
app.post('/validate/quick', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { content, source } = req.body;

  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const issues: LLMIssue[] = [];
  const regulatoryResult = validators.checkRegulatory(content);

  for (const v of regulatoryResult.violations) {
    issues.push({
      id: uuidv4(),
      type: 'regulatory',
      severity: v.severity,
      category: v.regulation,
      description: v.description || v.rule,
      suggestion: `Review ${v.regulation} compliance`,
      autoFixable: false,
    });
  }

  let riskScore = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': riskScore += 40; break;
      case 'high': riskScore += 25; break;
      case 'medium': riskScore += 15; break;
      case 'low': riskScore += 5; break;
    }
  }

  res.json({
    success: true,
    data: {
      id: uuidv4(),
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      riskScore: Math.min(100, riskScore),
      riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
      processingTimeMs: Date.now() - startTime,
    },
  });
});

/**
 * POST /validate/scan
 * Full scan with all checks
 */
app.post('/validate/scan', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { content, source, checkPII = true, checkTone = true } = req.body;

  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const issues: LLMIssue[] = [];

  // Regulatory check
  const regulatory = validators.checkRegulatory(content);
  for (const v of regulatory.violations) {
    issues.push({
      id: uuidv4(),
      type: 'regulatory',
      severity: v.severity,
      category: v.regulation,
      description: v.description || v.rule,
      suggestion: `Review ${v.regulation} compliance`,
      autoFixable: false,
    });
  }

  // PII check
  let piiCheck;
  if (checkPII) {
    piiCheck = validators.checkPII(content);
    if (piiCheck.detected) {
      for (const loc of piiCheck.locations) {
        issues.push({
          id: uuidv4(),
          type: 'pii',
          severity: 'high',
          category: loc.type,
          description: `Detected ${loc.type.toUpperCase()}`,
          position: loc.position,
          suggestion: 'Remove or mask personal information',
          autoFixable: true,
        });
      }
    }
  }

  // Tone analysis
  let toneAnalysis;
  if (checkTone) {
    toneAnalysis = validators.analyzeTone(content);
    if (toneAnalysis.overall === 'aggressive') {
      issues.push({
        id: uuidv4(),
        type: 'tone',
        severity: 'medium',
        category: 'Tone',
        description: 'Tone may be perceived as aggressive',
        suggestion: 'Consider a more neutral tone',
        autoFixable: true,
      });
    }
  }

  // Safety check
  const safetyIssues = validators.checkSafety(content);
  issues.push(...safetyIssues);

  // Calculate risk
  let riskScore = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': riskScore += 40; break;
      case 'high': riskScore += 25; break;
      case 'medium': riskScore += 15; break;
      case 'low': riskScore += 5; break;
    }
  }

  res.json({
    success: true,
    data: {
      id: uuidv4(),
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      piiCheck,
      toneAnalysis,
      riskScore: Math.min(100, riskScore),
      riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
      processingTimeMs: Date.now() - startTime,
    },
  });
});

// ============================================
// REWRITE ENDPOINTS
// ============================================

/**
 * POST /rewrite
 * Get rewrite suggestions
 */
app.post('/rewrite', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { content, issues } = req.body;

  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const parsedIssues: LLMIssue[] = issues || [];

  // If no issues provided, check content
  if (parsedIssues.length === 0) {
    const regulatory = validators.checkRegulatory(content);
    for (const v of regulatory.violations) {
      parsedIssues.push({
        id: uuidv4(),
        type: 'regulatory',
        severity: v.severity,
        category: v.regulation,
        description: v.description || v.rule,
        position: { start: content.indexOf(v.matchedText), end: content.indexOf(v.matchedText) + v.matchedText.length },
        suggestion: `Review ${v.regulation} compliance`,
        autoFixable: true,
      });
    }
  }

  const suggestions = validators.generateSuggestions(content, parsedIssues);

  // Apply suggestions
  let rewritten = content;
  for (const s of suggestions.sort((a, b) => b.position.start - a.position.start)) {
    rewritten = rewritten.substring(0, s.position.start) + s.replacement + rewritten.substring(s.position.end);
  }

  res.json({
    success: true,
    data: {
      original: content,
      rewritten,
      suggestions,
      improvements: suggestions.length,
    },
    meta: {
      processingTimeMs: Date.now() - startTime,
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
// HELPERS
// ============================================

async function validateContent(request: LLMValidationRequest, startTime: number): Promise<LLMValidationResult> {
  const issues: LLMIssue[] = [];

  // Regulatory check
  const regulatory = validators.checkRegulatory(request.content);
  for (const v of regulatory.violations) {
    issues.push({
      id: uuidv4(),
      type: 'regulatory',
      severity: v.severity,
      category: v.regulation,
      description: v.description || v.rule,
      suggestion: `Review ${v.regulation} compliance`,
      autoFixable: false,
    });
  }

  // PII check
  let piiCheck;
  if (request.options?.checkPII !== false) {
    piiCheck = validators.checkPII(request.content);
    if (piiCheck.detected) {
      for (const loc of piiCheck.locations) {
        issues.push({
          id: uuidv4(),
          type: 'pii',
          severity: 'high',
          category: loc.type,
          description: `Detected ${loc.type.toUpperCase()}`,
          position: loc.position,
          suggestion: 'Remove or mask personal information',
          autoFixable: true,
        });
      }
    }
  }

  // Tone analysis
  let toneAnalysis;
  if (request.options?.checkTone !== false) {
    toneAnalysis = validators.analyzeTone(request.content);
    if (toneAnalysis.overall === 'aggressive') {
      issues.push({
        id: uuidv4(),
        type: 'tone',
        severity: 'medium',
        category: 'Tone',
        description: 'Tone may be perceived as aggressive',
        suggestion: 'Consider a more neutral tone',
        autoFixable: true,
      });
    }
  }

  // Safety check
  const safetyIssues = validators.checkSafety(request.content);
  issues.push(...safetyIssues);

  // Calculate risk
  let riskScore = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': riskScore += 40; break;
      case 'high': riskScore += 25; break;
      case 'medium': riskScore += 15; break;
      case 'low': riskScore += 5; break;
    }
  }

  // Generate rewrite suggestions
  let rewriteSuggestions;
  if (request.options?.rewriteSuggestions) {
    rewriteSuggestions = validators.generateSuggestions(request.content, issues);
  }

  return {
    id: uuidv4(),
    valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
    issues,
    toneAnalysis,
    piiCheck,
    regulatoryCheck: {
      compliant: regulatory.compliant,
      violations: regulatory.violations.map(v => ({
        regulation: v.regulation,
        rule: v.rule,
        matchedText: v.matchedText,
        severity: v.severity,
      })),
    },
    rewriteSuggestions,
    riskScore: Math.min(100, riskScore),
    riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
    processingTimeMs: Date.now() - startTime,
  };
}

// ============================================
// STARTUP
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           TrustOS LLM Compliance Service                ║
╠══════════════════════════════════════════════════════════╣
║  Status:      RUNNING                              ║
║  Port:        ${PORT}                                    ║
║  Version:     1.0.0                               ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║  POST /validate        - Full validation           ║
║  POST /validate/quick  - Quick regulatory check   ║
║  POST /validate/scan   - Full scan               ║
║  POST /rewrite         - Get rewrite suggestions  ║
║  GET  /health         - Health check            ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
