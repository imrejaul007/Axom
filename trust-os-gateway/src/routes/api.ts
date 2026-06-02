/**
 * TrustOS API Routes
 * Main API endpoints for all trust, fraud, and identity services
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { fraudIntegration } from '../services/fraudIntegration.js';
import { identityIntegration } from '../services/identityIntegration.js';
import { consentIntegration } from '../services/consentIntegration.js';
import { trustScoringService } from '../services/trustScoring.js';
import { scamDetectionService } from '../services/scamDetection.js';

import type {
  FraudCheckRequest,
  IdentityResolutionRequest,
  ConsentRequest,
  ScamCheckRequest,
  ApiResponse,
} from '../types/index.js';

const router = Router();

// Request ID middleware
router.use((req: Request, res: Response, next) => {
  (req as any).requestId = req.headers['x-request-id'] || uuidv4();
  next();
});

// ============================================
// TRUST SCORE ROUTES
// ============================================

/**
 * GET /api/v1/trust/score/:entityType/:entityId
 * Get unified trust score for an entity
 */
router.get('/trust/score/:entityType/:entityId', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { entityType, entityId } = req.params;

  try {
    // Get fraud check if user/device
    let fraudCheck;
    if (entityType === 'person' || entityType === 'merchant') {
      fraudCheck = await fraudIntegration.checkFraud({
        transactionId: `trust-${entityId}-${Date.now()}`,
        userId: entityId,
        amount: 0,
        currency: 'INR',
      });
    }

    // Get identity resolution
    const identity = await identityIntegration.resolve({
      type: 'userId',
      value: entityId,
    });

    // Calculate trust score
    const trustScore = trustScoringService.calculateTrustScore(
      entityId,
      entityType as any,
      fraudCheck,
      identity
    );

    const response: ApiResponse<typeof trustScore> = {
      success: true,
      data: trustScore,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        processingTimeMs: Date.now() - startTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Trust score error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRUST_SCORE_ERROR',
        message: 'Failed to calculate trust score',
      },
    });
  }
});

/**
 * GET /api/v1/trust/score/unified
 * Get unified trust score for multiple identifiers
 */
router.post('/trust/score/unified', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { entityId, entityType = 'person' } = req.body;

    // Get fraud check
    const fraudCheck = await fraudIntegration.checkFraud({
      transactionId: `unified-${entityId}-${Date.now()}`,
      userId: entityId,
      amount: 0,
      currency: 'INR',
    });

    // Get identity
    const identity = await identityIntegration.resolve({
      type: 'userId',
      value: entityId,
    });

    // Calculate trust score
    const trustScore = trustScoringService.calculateTrustScore(
      entityId,
      entityType,
      fraudCheck,
      identity
    );

    res.json({
      success: true,
      data: {
        trustScore,
        fraudCheck,
        identity: identity ? {
          primaryId: identity.primaryId,
          verifiedLinks: identity.links.filter(l => l.verified).length,
          platforms: identity.platforms.length,
        } : null,
        recommendations: trustScoringService.getRecommendations(trustScore),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Unified trust score error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNIFIED_TRUST_ERROR',
        message: 'Failed to calculate unified trust score',
      },
    });
  }
});

// ============================================
// FRAUD CHECK ROUTES
// ============================================

/**
 * POST /api/v1/fraud/check
 * Check transaction for fraud
 */
router.post('/fraud/check', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const request: FraudCheckRequest = req.body;

    // Validate required fields
    if (!request.transactionId || !request.amount) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'transactionId and amount are required',
        },
      });
      return;
    }

    const result = await fraudIntegration.checkFraud(request);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        processingTimeMs: Date.now() - startTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Fraud check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FRAUD_CHECK_ERROR',
        message: 'Failed to check fraud',
      },
    });
  }
});

/**
 * GET /api/v1/fraud/blacklist/:type/:value
 * Check if entity is blacklisted
 */
router.get('/fraud/blacklist/:type/:value', async (req: Request, res: Response) => {
  const { type, value } = req.params;

  try {
    const result = await fraudIntegration.isBlacklisted(
      type as 'ip' | 'device' | 'user' | 'account',
      value
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Blacklist check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BLACKLIST_ERROR',
        message: 'Failed to check blacklist',
      },
    });
  }
});

// ============================================
// IDENTITY ROUTES
// ============================================

/**
 * POST /api/v1/identity/resolve
 * Resolve identity from identifier
 */
router.post('/identity/resolve', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const request: IdentityResolutionRequest = req.body;

    if (!request.type || !request.value) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'type and value are required',
        },
      });
      return;
    }

    const result = await identityIntegration.resolve(request);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        processingTimeMs: Date.now() - startTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Identity resolve error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'IDENTITY_ERROR',
        message: 'Failed to resolve identity',
      },
    });
  }
});

/**
 * POST /api/v1/identity/link
 * Link two identities
 */
router.post('/identity/link', async (req: Request, res: Response) => {
  const { sourceId, targetId, linkType, value } = req.body;

  try {
    const success = await identityIntegration.link(sourceId, targetId, linkType, value);

    res.json({
      success,
      data: { linked: success },
    });
  } catch (error) {
    console.error('Identity link error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'IDENTITY_LINK_ERROR',
        message: 'Failed to link identities',
      },
    });
  }
});

// ============================================
// CONSENT ROUTES
// ============================================

/**
 * POST /api/v1/consent/grant
 * Grant consent
 */
router.post('/consent/grant', async (req: Request, res: Response) => {
  const { userId, consentType } = req.body;

  try {
    const result = await consentIntegration.grant(userId, consentType);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Consent grant error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSENT_ERROR',
        message: 'Failed to grant consent',
      },
    });
  }
});

/**
 * POST /api/v1/consent/deny
 * Deny consent
 */
router.post('/consent/deny', async (req: Request, res: Response) => {
  const { userId, consentType } = req.body;

  try {
    const result = await consentIntegration.deny(userId, consentType);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Consent deny error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSENT_ERROR',
        message: 'Failed to deny consent',
      },
    });
  }
});

/**
 * GET /api/v1/consent/:userId
 * Get all consents for user
 */
router.get('/consent/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await consentIntegration.getConsents(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Consent get error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSENT_ERROR',
        message: 'Failed to get consents',
      },
    });
  }
});

// ============================================
// SCAM DETECTION ROUTES
// ============================================

/**
 * POST /api/v1/scam/check
 * Check content for scam indicators
 */
router.post('/scam/check', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const request: ScamCheckRequest = req.body;

    if (!request.type || !request.content) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'type and content are required',
        },
      });
      return;
    }

    const result = scamDetectionService.check(request);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        processingTimeMs: Date.now() - startTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Scam check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCAM_CHECK_ERROR',
        message: 'Failed to check for scam',
      },
    });
  }
});

/**
 * POST /api/v1/scam/check-sms
 * Quick SMS scam check
 */
router.post('/scam/check-sms', async (req: Request, res: Response) => {
  const { content, sender } = req.body;

  const result = scamDetectionService.check({
    type: 'sms',
    content,
    sender,
  });

  res.json({
    success: true,
    data: result,
  });
});

/**
 * POST /api/v1/scam/check-link
 * Quick link scam check
 */
router.post('/scam/check-link', async (req: Request, res: Response) => {
  const { url, userId } = req.body;

  const result = scamDetectionService.check({
    type: 'link',
    content: url,
    url,
    userId,
  });

  res.json({
    success: true,
    data: result,
  });
});

/**
 * POST /api/v1/scam/check-whatsapp
 * WhatsApp message scam check
 */
router.post('/scam/check-whatsapp', async (req: Request, res: Response) => {
  const { content, sender, userId } = req.body;

  const result = scamDetectionService.check({
    type: 'whatsapp',
    content,
    sender,
    userId,
  });

  res.json({
    success: true,
    data: result,
  });
});

// ============================================
// HEALTH CHECK
// ============================================

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'trust-os-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /ready
 * Readiness check
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check downstream services
    const checks = await Promise.allSettled([
      fraudIntegration.checkFraud({
        transactionId: 'health-check',
        amount: 0,
        currency: 'INR',
      }),
    ]);

    const allHealthy = checks.every(c => c.status === 'fulfilled');

    res.json({
      status: allHealthy ? 'ready' : 'degraded',
      services: {
        fraud: checks[0].status === 'fulfilled' ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
