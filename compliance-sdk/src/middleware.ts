/**
 * Express.js and Next.js middleware for TrustOS Compliance SDK
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ComplianceClient } from './client';
import { SDKConfig, ComplianceResult } from './types';

// Extend Express Request to include compliance results
declare global {
  namespace Express {
    interface Request {
      compliance?: ComplianceResult;
      complianceError?: Error;
    }
  }
}

interface ComplianceMiddlewareOptions {
  services?: ('communication' | 'llm' | 'audit')[];
  blockOnViolation?: boolean;
  logAllRequests?: boolean;
  skipPaths?: string[];
  client?: ComplianceClient;
}

/**
 * Create Express middleware for compliance checks
 */
export function complianceMiddleware(options: ComplianceMiddlewareOptions = {}): RequestHandler {
  const {
    services = ['communication', 'llm', 'audit'],
    blockOnViolation = true,
    logAllRequests = false,
    skipPaths = ['/health', '/metrics'],
    client: providedClient,
  } = options;

  let complianceClient: ComplianceClient;

  if (providedClient) {
    complianceClient = providedClient;
  } else {
    // Create client from environment variables
    complianceClient = new ComplianceClient({});
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip certain paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    try {
      let complianceResult: ComplianceResult | null = null;

      // Check based on route
      if (req.path.includes('/email') || req.path.includes('/send')) {
        if (services.includes('communication')) {
          complianceResult = await complianceClient.communication.validateEmail({
            to: req.body.to || '',
            subject: req.body.subject || '',
            body: req.body.body || req.body.content || '',
            cc: req.body.cc,
          });
        }
      } else if (req.path.includes('/llm') || req.path.includes('/generate')) {
        if (services.includes('llm')) {
          complianceResult = await complianceClient.llm.validate({
            content: req.body.content || req.body.prompt || '',
            context: {
              channel: 'api',
              purpose: req.body.purpose,
            },
          });
        }
      }

      // Always log if enabled
      if (services.includes('audit')) {
        await complianceClient.audit.log({
          eventType: 'USER_ACTION',
          userId: req.body.userId || req.headers['x-user-id'] as string || 'unknown',
          action: req.method + ' ' + req.path,
          resource: req.path,
          outcome: complianceResult?.canSend !== false ? 'SUCCESS' : 'BLOCKED',
          riskScore: complianceResult?.riskScore,
          violations: complianceResult?.violations,
          metadata: {
            body: req.body,
            query: req.query,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      // Attach results to request
      req.compliance = complianceResult || {
        passed: true,
        canSend: true,
        violations: [],
        warnings: [],
        riskScore: 0,
        requiresReview: false,
      };

      // Block if violation and blocking is enabled
      if (blockOnViolation && complianceResult && !complianceResult.canSend) {
        req.complianceError = new Error('Compliance violation');
        return res.status(400).json({
          error: 'COMPLIANCE_VIOLATION',
          message: 'Request blocked due to compliance violation',
          violations: complianceResult.violations,
          warnings: complianceResult.warnings,
        });
      }

      next();
    } catch (error) {
      // Log error but don't block unless critical
      if (services.includes('audit')) {
        await complianceClient.audit.log({
          eventType: 'ERROR',
          userId: req.body.userId || 'unknown',
          action: req.method + ' ' + req.path,
          outcome: 'ERROR',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        }).catch(() => {}); // Don't fail on log failure
      }

      // On service unavailable, fail open for advisory mode
      if (error instanceof Error && error.message.includes('unavailable')) {
        return next();
      }

      next(error);
    }
  };
}

/**
 * Middleware for LLM output validation
 */
export function llmOutputMiddleware(options: {
  client?: ComplianceClient;
  validateOnStream?: boolean;
} = {}): RequestHandler {
  let complianceClient: ComplianceClient;

  if (options.client) {
    complianceClient = options.client;
  } else {
    complianceClient = new ComplianceClient({});
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    let responseBuffer = '';

    // Override write to capture response
    res.write = function(chunk: any, encoding: any, callback: any): boolean {
      if (typeof chunk === 'string') {
        responseBuffer += chunk;
      } else if (Buffer.isBuffer(chunk)) {
        responseBuffer += chunk.toString();
      }
      return originalWrite(chunk, encoding, callback);
    } as any;

    // Override end to validate before sending
    res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
      if (chunk) {
        if (typeof chunk === 'string') {
          responseBuffer += chunk;
        } else if (Buffer.isBuffer(chunk)) {
          responseBuffer += chunk.toString();
        }
      }

      // Validate response asynchronously (don't block)
      complianceClient.llm.validate({
        content: responseBuffer,
        context: {
          channel: 'api',
          purpose: req.body?.purpose || 'unknown',
        },
      }).then(result => {
        if (!result.canSend) {
          // Log violation but don't try to recall already sent data
          complianceClient.audit.log({
            eventType: 'MESSAGE_BLOCKED',
            userId: req.body?.userId || 'system',
            action: 'LLM_OUTPUT_VALIDATION',
            outcome: 'BLOCKED',
            riskScore: result.riskScore,
            violations: result.violations,
            metadata: { responseLength: responseBuffer.length },
          });
        }
      }).catch(() => {}); // Don't fail on validation error

      return originalEnd(chunk, encoding as any, callback);
    } as any;

    next();
  };
}

/**
 * Next.js API route wrapper with compliance
 */
export function withCompliance(
  handler: (req: Request, res: Response) => Promise<void>,
  options: ComplianceMiddlewareOptions = {}
) {
  const middleware = complianceMiddleware(options);

  return async (req: Request, res: Response) => {
    // Apply middleware
    await new Promise<void>((resolve, reject) => {
      middleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Call original handler
    await handler(req, res);
  };
}

/**
 * Agent action guard middleware
 */
export function agentActionGuard(options: {
  agentId: string;
  allowedActions?: string[];
  client?: ComplianceClient;
}): RequestHandler {
  let complianceClient: ComplianceClient;

  if (options.client) {
    complianceClient = options.client;
  } else {
    complianceClient = new ComplianceClient({});
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const action = req.body.action || req.path.split('/').pop();

    // Check if action is allowed
    if (options.allowedActions && !options.allowedActions.includes(action)) {
      return res.status(403).json({
        error: 'ACTION_NOT_ALLOWED',
        message: `Action '${action}' is not in the allowed list for this agent`,
      });
    }

    try {
      const permission = await complianceClient.agent.checkPermission({
        agentId: options.agentId,
        action,
        resource: req.body.resource,
        context: {
          purpose: req.body.purpose,
          urgency: req.body.urgency,
        },
      });

      if (!permission.allowed) {
        return res.status(403).json({
          error: 'PERMISSION_DENIED',
          message: permission.reason || 'Agent does not have permission for this action',
          requiresApproval: permission.requiresApproval,
          approvalId: permission.approvalId,
        });
      }

      // Attach permission to request
      (req as any).agentPermission = permission;
      next();
    } catch (error) {
      next(error);
    }
  };
}
