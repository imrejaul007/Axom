/**
 * TrustOS Agent Governance Service
 * Control AI agent actions
 *
 * Port: 4184
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { PermissionEngine, permissionEngine } from './engine.js';
import type {
  Agent,
  ActionRequest,
  ActionDecision,
  AuditLog,
  ApprovalRequest,
  AgentType,
  AgentStatus,
} from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4184', 10);

// In-memory stores (would be database in production)
const agents = new Map<string, Agent>();
const auditLogs: AuditLog[] = [];
const approvalQueue: ApprovalRequest[] = [];

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
    service: 'agent-governance',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// AGENT MANAGEMENT
// ============================================

/**
 * POST /agents
 * Register new agent
 */
app.post('/agents', (req: Request, res: Response) => {
  try {
    const { name, type, description, permissions, roles, boundaries } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'name and type are required' });
      return;
    }

    const agent = permissionEngine.registerAgent({
      name,
      type: type as AgentType,
      description: description || '',
      status: 'active' as AgentStatus,
      permissions: permissions || [],
      roles: roles || [],
      boundaries: boundaries || [],
    });

    agents.set(agent.id, agent);

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Register agent error:', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

/**
 * GET /agents
 * List all agents
 */
app.get('/agents', (req: Request, res: Response) => {
  const { status, type } = req.query;

  let list = Array.from(agents.values());
  if (status) list = list.filter(a => a.status === status);
  if (type) list = list.filter(a => a.type === type);

  res.json({
    success: true,
    data: { agents: list, total: list.length },
  });
});

/**
 * GET /agents/:id
 * Get agent by ID
 */
app.get('/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true, data: agent });
});

/**
 * PATCH /agents/:id
 * Update agent
 */
app.patch('/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  const { name, description, status, permissions, boundaries } = req.body;

  if (name) agent.name = name;
  if (description !== undefined) agent.description = description;
  if (status) agent.status = status as AgentStatus;
  if (permissions) agent.permissions = permissions;
  if (boundaries) agent.boundaries = boundaries;
  agent.updatedAt = new Date();

  res.json({ success: true, data: agent });
});

/**
 * POST /agents/:id/suspend
 * Suspend agent
 */
app.post('/agents/:id/suspend', (req: Request, res: Response) => {
  const success = permissionEngine.suspendAgent(req.params.id);

  if (success) {
    const agent = agents.get(req.params.id);
    res.json({ success: true, data: agent });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

/**
 * POST /agents/:id/activate
 * Activate agent
 */
app.post('/agents/:id/activate', (req: Request, res: Response) => {
  const success = permissionEngine.activateAgent(req.params.id);

  if (success) {
    const agent = agents.get(req.params.id);
    res.json({ success: true, data: agent });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * POST /check
 * Check if agent can perform action
 */
app.post('/check', (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { agentId, action, resource, payload, context } = req.body;

    if (!agentId || !action) {
      res.status(400).json({ error: 'agentId and action are required' });
      return;
    }

    const request: ActionRequest = {
      id: uuidv4(),
      agentId,
      action,
      resource,
      payload,
      context: context || {},
      timestamp: new Date(),
    };

    const decision = permissionEngine.checkPermission(request);

    // Log to audit
    logAction(request, decision);

    res.json({
      success: true,
      data: {
        ...decision,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
});

/**
 * POST /check/batch
 * Batch permission check
 */
app.post('/check/batch', (req: Request, res: Response) => {
  const { requests } = req.body;

  if (!requests || !Array.isArray(requests)) {
    res.status(400).json({ error: 'requests array is required' });
    return;
  }

  const results = requests.map((req: Omit<ActionRequest, 'id' | 'timestamp'>) => {
    const request: ActionRequest = {
      ...req,
      id: uuidv4(),
      timestamp: new Date(),
    };
    return permissionEngine.checkPermission(request);
  });

  res.json({ success: true, data: { results } });
});

// ============================================
// AUDIT
// ============================================

/**
 * GET /audit
 * Get audit logs
 */
app.get('/audit', (req: Request, res: Response) => {
  const { agentId, action, decision, limit = 100 } = req.query;

  let logs = [...auditLogs].reverse();
  if (agentId) logs = logs.filter(l => l.agentId === agentId);
  if (action) logs = logs.filter(l => l.action === action);
  if (decision) logs = logs.filter(l => l.decision === decision);
  logs = logs.slice(0, Number(limit));

  res.json({ success: true, data: { logs, total: auditLogs.length } });
});

/**
 * GET /audit/:id
 * Get audit log entry
 */
app.get('/audit/:id', (req: Request, res: Response) => {
  const log = auditLogs.find(l => l.id === req.params.id);

  if (!log) {
    res.status(404).json({ error: 'Audit log not found' });
    return;
  }

  res.json({ success: true, data: log });
});

// ============================================
// APPROVAL QUEUE
// ============================================

/**
 * GET /approvals
 * Get pending approvals
 */
app.get('/approvals', (req: Request, res: Response) => {
  const pending = approvalQueue.filter(a => a.status === 'pending');

  res.json({
    success: true,
    data: { approvals: pending, total: pending.length },
  });
});

/**
 * POST /approvals
 * Request approval
 */
app.post('/approvals', (req: Request, res: Response) => {
  const { agentId, action, payload, reason, requestedBy } = req.body;

  const approval: ApprovalRequest = {
    id: uuidv4(),
    agentId,
    action,
    payload: payload || {},
    reason: reason || 'Manual approval requested',
    status: 'pending',
    requestedBy: requestedBy || 'system',
    requestedAt: new Date(),
  };

  approvalQueue.push(approval);

  res.json({ success: true, data: approval });
});

/**
 * POST /approvals/:id/approve
 * Approve request
 */
app.post('/approvals/:id/approve', (req: Request, res: Response) => {
  const { reviewedBy, reviewNotes } = req.body;
  const approval = approvalQueue.find(a => a.id === req.params.id);

  if (!approval) {
    res.status(404).json({ error: 'Approval not found' });
    return;
  }

  approval.status = 'approved';
  approval.reviewedBy = reviewedBy;
  approval.reviewedAt = new Date();
  approval.reviewNotes = reviewNotes;

  res.json({ success: true, data: approval });
});

/**
 * POST /approvals/:id/reject
 * Reject request
 */
app.post('/approvals/:id/reject', (req: Request, res: Response) => {
  const { reviewedBy, reviewNotes } = req.body;
  const approval = approvalQueue.find(a => a.id === req.params.id);

  if (!approval) {
    res.status(404).json({ error: 'Approval not found' });
    return;
  }

  approval.status = 'rejected';
  approval.reviewedBy = reviewedBy;
  approval.reviewedAt = new Date();
  approval.reviewNotes = reviewNotes;

  res.json({ success: true, data: approval });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get governance statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const agentList = Array.from(agents.values());

  res.json({
    success: true,
    data: {
      agents: {
        total: agentList.length,
        active: agentList.filter(a => a.status === 'active').length,
        suspended: agentList.filter(a => a.status === 'suspended').length,
      },
      audit: {
        total: auditLogs.length,
        allowed: auditLogs.filter(l => l.decision === 'allow').length,
        denied: auditLogs.filter(l => l.decision === 'deny').length,
        blocked: auditLogs.filter(l => l.decision === 'block').length,
        review: auditLogs.filter(l => l.decision === 'review').length,
      },
      approvals: {
        pending: approvalQueue.filter(a => a.status === 'pending').length,
        approved: approvalQueue.filter(a => a.status === 'approved').length,
        rejected: approvalQueue.filter(a => a.status === 'rejected').length,
      },
    },
  });
});

// ============================================
// HELPERS
// ============================================

function logAction(request: ActionRequest, decision: ActionDecision): void {
  const log: AuditLog = {
    id: uuidv4(),
    agentId: request.agentId,
    action: request.action,
    decision: decision.decision,
    resource: request.resource,
    payload: request.payload,
    context: request.context,
    reason: decision.reason,
    timestamp: new Date(),
  };

  auditLogs.push(log);

  // Keep only last 10000 logs
  if (auditLogs.length > 10000) {
    auditLogs.splice(0, auditLogs.length - 10000);
  }
}

// ============================================
// STARTUP
// ============================================

app.listen(PORT, () => {
  logger.info(
╔══════════════════════════════════════════════════════════╗
║          TrustOS Agent Governance Service               ║
╠══════════════════════════════════════════════════════════╣
║  Status:      RUNNING                              ║
║  Port:        ${PORT}                                    ║
║  Version:     1.0.0                               ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║  POST /agents       - Register agent               ║
║  GET  /agents       - List agents                   ║
║  POST /check        - Check permission              ║
║  GET  /audit        - Get audit logs               ║
║  GET  /approvals    - Pending approvals            ║
║  GET  /stats        - Statistics                   ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
