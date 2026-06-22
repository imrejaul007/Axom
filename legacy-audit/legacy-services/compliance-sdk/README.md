# TrustOS Compliance SDK

Unified TypeScript/JavaScript SDK for integrating with all TrustOS Compliance Services.

## Installation

```bash
npm install @trustos/compliance-sdk
```

## Services Covered

| Service | Port | Description |
|---------|------|-------------|
| Communication Compliance | 4180 | Pre-send validation of emails, messages, documents |
| Policy Engine | 4181 | Policy document parsing and rule extraction |
| Enforcement Gateway | 4182 | Real-time blocking, quarantine, advisory modes |
| LLM Compliance | 4183 | AI-generated content validation |
| Agent Governance | 4184 | AI agent permission control |
| Audit Trail | 4185 | Compliance logging and reporting |

## Quick Start

```typescript
import { ComplianceClient, createComplianceClient } from '@trustos/compliance-sdk';

// Create client with all services
const client = createComplianceClient({
  communicationCompliance: 'http://localhost:4180',
  policyEngine: 'http://localhost:4181',
  enforcementGateway: 'http://localhost:4182',
  llmCompliance: 'http://localhost:4183',
  agentGovernance: 'http://localhost:4184',
  auditTrail: 'http://localhost:4185',
});

// Validate outgoing email before sending
const result = await client.communication.validateEmail({
  to: 'client@example.com',
  cc: ['manager@company.com'],
  subject: 'Q3 Financial Summary',
  body: 'Based on the current market analysis...',
  attachments: [{ name: 'report.pdf', size: 1024 }],
});

// Check if email can be sent
if (result.canSend) {
  console.log('Email passed compliance checks');
} else {
  console.log('Blocked:', result.blockedBy);
}
```

## Full API Reference

### Communication Compliance (4180)

```typescript
// Validate email
const emailResult = await client.communication.validateEmail({
  to: string,
  cc?: string[],
  bcc?: string[],
  subject: string,
  body: string,
  attachments?: Attachment[],
});

// Validate document
const docResult = await client.communication.validateDocument({
  title: string,
  content: string,
  type: 'pdf' | 'word' | 'excel' | 'text',
  metadata?: Record<string, any>,
});

// Validate LinkedIn post
const linkedInResult = await client.communication.validateLinkedIn({
  content: string,
  hashtags?: string[],
  mentions?: string[],
  visibility: 'public' | 'connections' | 'private',
});

// Get compliance rules
const rules = await client.communication.getRules();

// Get specific rule by ID
const rule = await client.communication.getRule('SEC-001');

// Add/update rule
await client.communication.addRule(ruleDefinition);

// Check specific regulation
const regCheck = await client.communication.checkRegulation('FINRA', {
  content: 'Your portfolio has returned 15%',
});
```

### Policy Engine (4181)

```typescript
// Parse policy document
const parsed = await client.policy.parsePolicy({
  content: policyText,
  source: 'manual' | 'url' | 'file',
  metadata?: {
    department?: string,
    effectiveDate?: string,
  },
});

// Get extracted rules
const rules = await client.policy.getExtractedRules(policyId);

// Generate machine-readable rules
const mrbRules = await client.policy.generateRules(policyId);

// Get all policies
const policies = await client.policy.getPolicies();

// Get policy by ID
const policy = await client.policy.getPolicy(policyId);

// Check compliance against all applicable policies
const compliance = await client.policy.checkCompliance(content);
```

### Enforcement Gateway (4182)

```typescript
// Pre-send validation (returns immediate decision)
const decision = await client.enforcement.preSendValidate({
  channel: 'email' | 'linkedin' | 'document' | 'api',
  content: messageContent,
  metadata: {
    sender: userId,
    recipient: recipientId,
    timestamp: new Date().toISOString(),
  },
});

// Submit for manual review
const reviewId = await client.enforcement.submitForReview({
  channel: 'email',
  content: messageContent,
  reason: 'Manual review requested',
});

// Get quarantine queue
const queue = await client.enforcement.getQuarantineQueue();

// Approve quarantined item
await client.enforcement.approveQuarantined(reviewId);

// Reject quarantined item
await client.enforcement.rejectQuarantined(reviewId, {
  reason: 'Violation of policy XYZ',
});

// Get enforcement stats
const stats = await client.enforcement.getStats();

// Set enforcement mode
await client.enforcement.setMode('blocking'); // blocking | advisory | audit
```

### LLM Compliance (4183)

```typescript
// Validate AI-generated content
const llmResult = await client.llm.validate({
  content: aiGeneratedText,
  context: {
    userId: string,
    channel: 'email' | 'chat' | 'document',
    purpose: 'customer_communication' | 'marketing' | 'internal',
  },
});

// Validate tone
const toneCheck = await client.llm.checkTone({
  content: aiGeneratedText,
  expectedTones: ['professional', 'helpful'],
  prohibitedTones: ['aggressive', 'manipulative'],
});

// Check for PII
const piiCheck = await client.llm.checkPII(content);

// Validate against policies
const policyCheck = await client.llm.validatePolicies(content);

// Generate compliance report
const report = await client.llm.generateReport(content, {
  includePII: true,
  includeTone: true,
  includePolicy: true,
});
```

### Agent Governance (4184)

```typescript
// Check if action is allowed
const permission = await client.agent.checkPermission({
  agentId: string,
  action: 'send_email' | 'access_data' | 'modify_record',
  resource: 'customer_123',
  context?: {
    purpose: string,
    urgency?: 'low' | 'medium' | 'high',
  },
});

// Get agent permissions
const perms = await client.agent.getAgentPermissions(agentId);

// Grant permission
await client.agent.grantPermission({
  agentId: string,
  action: string,
  resource?: string,
  conditions?: PermissionCondition[],
  expiresAt?: Date,
});

// Revoke permission
await client.agent.revokePermission({
  agentId: string,
  action: string,
  resource?: string,
});

// Create approval request for restricted action
const approvalId = await client.agent.requestApproval({
  agentId: string,
  action: string,
  resource: string,
  justification: string,
  estimatedImpact?: string,
});

// Get approval queue (for human reviewers)
const approvals = await client.agent.getApprovalQueue();

// Approve request
await client.agent.approveRequest(approvalId, {
  approverId: string,
  conditions?: string[],
  notes?: string,
});

// Reject request
await client.agent.rejectRequest(approvalId, {
  approverId: string,
  reason: string,
});

// Set agent boundaries
await client.agent.setBoundaries(agentId, {
  rateLimit: { maxActions: 100, windowMs: 60000 },
  dataAccess: { allowedTypes: ['customer', 'order'] },
  timeWindows: { allowedHours: { start: '09:00', end: '17:00' } },
});
```

### Audit Trail (4185)

```typescript
// Log compliance event
await client.audit.log({
  eventType: 'MESSAGE_SENT' | 'MESSAGE_BLOCKED' | 'APPROVAL_REQUESTED',
  userId: string,
  action: 'email_sent',
  resource: messageId,
  outcome: 'SUCCESS' | 'BLOCKED' | 'REVIEW_REQUIRED',
  metadata: {
    recipient: string,
    channel: 'email',
  },
  riskScore?: 0.3,
});

// Query logs
const logs = await client.audit.query({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  eventTypes?: ['MESSAGE_SENT', 'MESSAGE_BLOCKED'],
  users?: [userId1, userId2],
  outcome?: 'SUCCESS',
  limit?: 100,
});

// Get user activity
const activity = await client.audit.getUserActivity(userId, {
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
});

// Get compliance summary
const summary = await client.audit.getComplianceSummary({
  period: '30d',
  groupBy: 'day',
});

// Generate audit report
const report = await client.audit.generateReport({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  format: 'pdf' | 'csv' | 'json',
  sections: ['summary', 'violations', 'approvals'],
  includeCharts: true,
});

// Get violation trends
const trends = await client.audit.getViolationTrends({
  period: '90d',
  groupBy: 'week',
  categories: ['SEC', 'FINRA', 'RBI', 'POLICY'],
});

// Export logs
const exportId = await client.audit.exportLogs({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  format: 'csv',
  filters: { outcome: 'BLOCKED' },
});

// Get export status
const exportStatus = await client.audit.getExportStatus(exportId);
```

## Type Definitions

### Core Types

```typescript
interface ComplianceResult {
  passed: boolean;
  canSend: boolean;
  violations: Violation[];
  warnings: Warning[];
  riskScore: number;
  requiresReview: boolean;
  reviewReason?: string;
}

interface Violation {
  code: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  matchedContent?: string;
  suggestion?: string;
}

interface Warning {
  code: string;
  rule: string;
  message: string;
  suggestion?: string;
}

interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  conditions?: string[];
  expiresAt?: Date;
}
```

## Error Handling

```typescript
import { ComplianceError, ServiceUnavailableError, ValidationError } from '@trustos/compliance-sdk';

try {
  const result = await client.communication.validateEmail(emailData);
} catch (error) {
  if (error instanceof ServiceUnavailableError) {
    console.log('Compliance service temporarily unavailable');
  } else if (error instanceof ValidationError) {
    console.log('Invalid request:', error.details);
  } else if (error instanceof ComplianceError) {
    console.log('Compliance check failed:', error.message);
  }
}
```

## Configuration

### Environment Variables

```bash
# Service URLs
COMMUNICATION_COMPLIANCE_URL=http://localhost:4180
POLICY_ENGINE_URL=http://localhost:4181
ENFORCEMENT_GATEWAY_URL=http://localhost:4182
LLM_COMPLIANCE_URL=http://localhost:4183
AGENT_GOVERNANCE_URL=http://localhost:4184
AUDIT_TRAIL_URL=http://localhost:4185

# Authentication
COMPLIANCE_API_KEY=your-api-key

# Timeouts (ms)
COMPLIANCE_TIMEOUT=30000

# Retry Configuration
COMPLIANCE_MAX_RETRIES=3
COMPLIANCE_RETRY_DELAY=1000
```

### Using Config File

```typescript
import { ComplianceClient } from '@trustos/compliance-sdk';

const client = new ComplianceClient({
  // Individual service URLs
  communicationCompliance: process.env.COMMUNICATION_COMPLIANCE_URL,
  policyEngine: process.env.POLICY_ENGINE_URL,
  enforcementGateway: process.env.ENFORCEMENT_GATEWAY_URL,
  llmCompliance: process.env.LLM_COMPLIANCE_URL,
  agentGovernance: process.env.AGENT_GOVERNANCE_URL,
  auditTrail: process.env.AUDIT_TRAIL_URL,

  // Global options
  apiKey: process.env.COMPLIANCE_API_KEY,
  timeout: 30000,
  retries: 3,

  // Circuit breaker
  circuitBreaker: {
    enabled: true,
    threshold: 5,
    resetTimeout: 60000,
  },
});
```

## React Hooks

```typescript
import { useComplianceCheck, useAgentPermission, useAuditLog } from '@trustos/compliance-sdk/react';

// Hook for email validation
function EmailForm() {
  const { validate, result, loading, error } = useComplianceCheck('email');

  const handleSend = async (email) => {
    const check = await validate(email);
    if (check.canSend) {
      sendEmail(email);
    } else {
      showViolations(check.violations);
    }
  };

  return (/* ... */);
}

// Hook for agent permissions
function ActionButton({ action, resource }) {
  const { checkPermission, hasPermission, loading } = useAgentPermission('my-agent-id');

  useEffect(() => {
    checkPermission(action, resource);
  }, [action, resource]);

  if (loading) return <Spinner />;
  if (!hasPermission) return <DisabledButton />;
  return <Button onClick={() => execute(action)} />;
}

// Hook for audit logging
function AuditLogger() {
  const { logEvent, recentEvents } = useAuditLog();

  useEffect(() => {
    logEvent({
      eventType: 'PAGE_VIEW',
      action: 'viewed_dashboard',
      outcome: 'SUCCESS',
    });
  }, []);

  return (/* ... */);
}
```

## Middleware

### Express.js Middleware

```typescript
import express from 'express';
import { complianceMiddleware } from '@trustos/compliance-sdk/express';

const app = express();

// Apply compliance check to all outbound emails
app.use(complianceMiddleware({
  services: ['communication', 'llm', 'audit'],
  blockOnViolation: true,
  logAllRequests: true,
}));

// Routes
app.post('/api/email', async (req, res) => {
  // req.compliance contains validation results
  if (req.compliance?.canSend) {
    // Send email
  } else {
    res.status(400).json({ violations: req.compliance.violations });
  }
});
```

### Next.js API Route Handler

```typescript
import { withCompliance } from '@trustos/compliance-sdk/nextjs';

export default withCompliance(async (req, res) => {
  // Handler with automatic compliance checks
  // req.compliance contains validation results
}, {
  services: ['communication', 'llm'],
  applyTo: ['/api/send-email', '/api/generate-content'],
});
```

## License

MIT
