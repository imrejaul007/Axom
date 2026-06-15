/**
 * Compliance Services Integration Tests
 * Tests for the TrustOS Compliance SDK
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = process.env.COMPLIANCE_BASE_URL || 'http://localhost';

// Test configuration
const services = {
  communication: process.env.COMMUNICATION_URL || `${BASE_URL}:4180`,
  policy: process.env.POLICY_URL || `${BASE_URL}:4181`,
  enforcement: process.env.ENFORCEMENT_URL || `${BASE_URL}:4182`,
  llm: process.env.LLM_URL || `${BASE_URL}:4183`,
  agent: process.env.AGENT_URL || `${BASE_URL}:4184`,
  audit: process.env.AUDIT_URL || `${BASE_URL}:4185`,
};

// Helper to make requests
async function apiRequest(baseUrl: string, path: string, method = 'GET', body?: any) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json() };
}

describe('Communication Compliance Service (4180)', () => {
  test('health check returns healthy', async () => {
    const { status, data } = await apiRequest(services.communication, '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('validate email passes for compliant content', async () => {
    const { status, data } = await apiRequest(services.communication, '/api/validate/email', 'POST', {
      to: 'client@example.com',
      subject: 'Weekly Update',
      body: 'Hello, here is your weekly project update.',
      cc: ['manager@company.com'],
    });
    expect(status).toBe(200);
    expect(data.passed).toBe(true);
  });

  test('validate email blocks insider trading patterns', async () => {
    const { status, data } = await apiRequest(services.communication, '/api/validate/email', 'POST', {
      to: 'friend@email.com',
      subject: 'Stock tip',
      body: 'Buy more shares before the earnings announcement next week.',
    });
    expect(status).toBe(200);
    expect(data.passed).toBe(false);
    expect(data.violations.length).toBeGreaterThan(0);
  });

  test('get rules returns regulatory rules', async () => {
    const { status, data } = await apiRequest(services.communication, '/api/rules');
    expect(status).toBe(200);
    expect(data.rules.length).toBeGreaterThan(0);
  });
});

describe('Policy Engine Service (4181)', () => {
  test('health check returns healthy', async () => {
    const { status, data } = await apiRequest(services.policy, '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('parse policy extracts rules', async () => {
    const policyText = `
      SECTION: COMMUNICATIONS COMPLIANCE

      All outgoing communications must:
      1. Not contain material non-public information
      2. Include appropriate disclosures
      3. Be reviewed for regulatory compliance

      Prohibited content includes:
      - Securities recommendations without proper disclosure
      - Unverified performance claims
    `;

    const { status, data } = await apiRequest(services.policy, '/api/policies/parse', 'POST', {
      content: policyText,
      source: 'manual',
    });
    expect(status).toBe(200);
    expect(data.policy).toBeDefined();
    expect(data.rules.length).toBeGreaterThan(0);
  });

  test('get policies returns list', async () => {
    const { status, data } = await apiRequest(services.policy, '/api/policies');
    expect(status).toBe(200);
    expect(Array.isArray(data.policies)).toBe(true);
  });
});

describe('Enforcement Gateway (4182)', () => {
  test('health check returns healthy', async () => {
    const { status, data } = await apiRequest(services.enforcement, '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('pre-send validation returns decision', async () => {
    const { status, data } = await apiRequest(services.enforcement, '/api/enforce/pre-send', 'POST', {
      channel: 'email',
      content: { body: 'Test message' },
      metadata: { sender: 'user123', recipient: 'user456' },
    });
    expect(status).toBe(200);
    expect(data.allowed).toBeDefined();
    expect(data.mode).toBeDefined();
  });

  test('get mode returns current mode', async () => {
    const { status, data } = await apiRequest(services.enforcement, '/api/enforce/mode');
    expect(status).toBe(200);
    expect(['blocking', 'advisory', 'audit']).toContain(data.mode);
  });

  test('set mode updates enforcement mode', async () => {
    const { status, data } = await apiRequest(services.enforcement, '/api/enforce/mode', 'POST', {
      mode: 'advisory',
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('LLM Compliance Service (4183)', () => {
  test('health check returns healthy', async () => {
    const { status, data } = await apiRequest(services.llm, '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('validate LLM content', async () => {
    const { status, data } = await apiRequest(services.llm, '/api/llm/validate', 'POST', {
      content: 'Based on market analysis, your portfolio should perform well.',
      context: { channel: 'email', purpose: 'customer_communication' },
    });
    expect(status).toBe(200);
    expect(data.passed).toBeDefined();
    expect(data.riskScore).toBeDefined();
  });

  test('PII detection works', async () => {
    const { status, data } = await apiRequest(services.llm, '/api/llm/pii', 'POST', {
      content: 'Contact John at 123-45-6789 or john@email.com',
    });
    expect(status).toBe(200);
    expect(data.detected).toBeDefined();
  });
});

describe('Agent Governance Service (4184)', () => {
  test('health check returns healthy', async () => {
    const { status, data } = await apiRequest(services.agent, '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('register and check agent permission', async () => {
    // Register agent
    const { status: regStatus } = await apiRequest(services.agent, '/api/agents', 'POST', {
      id: 'test-agent-001',
      name: 'Test Agent',
      type: 'email-assistant',
      capabilities: ['send_email', 'read_contacts'],
    });
    expect(regStatus).toBe(200);

    // Check permission
    const { status, data } = await apiRequest(services.agent, '/api/permissions/check', 'POST', {
      agentId: 'test-agent-001',
      action: 'send_email',
    });
    expect(status).toBe(200);
    expect(data.allowed).toBeDefined();
  });

  test('get approval queue', async () => {
    const { status, data } = await apiRequest(services.agent, '/api/approvals');
    expect(status).toBe(200);
    expect(Array.isArray(data.approvals)).toBe(true);
  });
});

describe('Audit Trail Service (4185)', () => {
  test('health check returns healthy', async () => {
    const { status, data } = await apiRequest(services.audit, '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('log audit event', async () => {
    const { status, data } = await apiRequest(services.audit, '/api/audit/log', 'POST', {
      eventType: 'MESSAGE_SENT',
      userId: 'user123',
      action: 'email_sent',
      resource: 'msg-456',
      outcome: 'SUCCESS',
      metadata: { channel: 'email', recipient: 'client@example.com' },
    });
    expect(status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  test('query audit logs', async () => {
    const { status, data } = await apiRequest(services.audit, '/api/audit/query', 'POST', {
      limit: 10,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.total).toBeDefined();
  });

  test('get compliance summary', async () => {
    const { status, data } = await apiRequest(services.audit, '/api/audit/summary', 'POST', {
      period: '7d',
      groupBy: 'day',
    });
    expect(status).toBe(200);
    expect(data.totalEvents).toBeDefined();
  });
});

describe('End-to-End Compliance Flow', () => {
  test('complete email compliance workflow', async () => {
    // 1. Validate email
    const validateResult = await apiRequest(services.communication, '/api/validate/email', 'POST', {
      to: 'client@example.com',
      subject: 'Q3 Financial Summary',
      body: 'Your portfolio has returned 12% this quarter.',
      cc: ['manager@company.com'],
    });
    expect(validateResult.status).toBe(200);

    // 2. Log to audit trail
    const logResult = await apiRequest(services.audit, '/api/audit/log', 'POST', {
      eventType: validateResult.data.passed ? 'MESSAGE_SENT' : 'MESSAGE_BLOCKED',
      userId: 'user123',
      action: 'email_validation',
      resource: 'validation-' + Date.now(),
      outcome: validateResult.data.passed ? 'SUCCESS' : 'BLOCKED',
      violations: validateResult.data.violations,
      riskScore: validateResult.data.riskScore,
    });
    expect(logResult.status).toBe(200);
  });

  test('agent action with governance', async () => {
    // 1. Register agent
    await apiRequest(services.agent, '/api/agents', 'POST', {
      id: 'e2e-test-agent',
      name: 'E2E Test Agent',
      type: 'document-processor',
      capabilities: ['read_document', 'analyze_content'],
    });

    // 2. Try to send email (should be denied)
    const permissionResult = await apiRequest(services.agent, '/api/permissions/check', 'POST', {
      agentId: 'e2e-test-agent',
      action: 'send_email',
    });
    expect(permissionResult.status).toBe(200);
    expect(permissionResult.data.allowed).toBe(false);

    // 3. Request approval
    const approvalResult = await apiRequest(services.agent, '/api/approvals/request', 'POST', {
      agentId: 'e2e-test-agent',
      action: 'send_email',
      justification: 'Required for customer notifications',
      requestedBy: 'admin',
    });
    expect(approvalResult.status).toBe(200);
    expect(approvalResult.data.status).toBe('pending');
  });
});
