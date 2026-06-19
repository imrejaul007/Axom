/**
 * Compliance SDK Unit Tests
 *
 * These tests validate the SDK structure, configuration, and exported API
 * without requiring the backend services to be running on localhost:4180-4185.
 *
 * For end-to-end integration tests against live services, see:
 *   tests/integration.test.ts (skipped unless COMPLIANCE_INTEGRATION=1)
 */

import { describe, test, expect } from '@jest/globals';
import {
  ComplianceClient,
  createComplianceClient,
  createSingleServiceClient,
} from '../src/client';
import { ComplianceError, ValidationError, TimeoutError, ServiceUnavailableError } from '../src/errors';
import type { SDKConfig } from '../src/types';

describe('Compliance SDK - Unit Tests', () => {
  describe('Exports', () => {
    test('exports ComplianceClient class', () => {
      expect(ComplianceClient).toBeDefined();
      expect(typeof ComplianceClient).toBe('function');
    });

    test('exports factory functions', () => {
      expect(typeof createComplianceClient).toBe('function');
      expect(typeof createSingleServiceClient).toBe('function');
    });

    test('exports error classes', () => {
      expect(ComplianceError).toBeDefined();
      expect(ValidationError).toBeDefined();
      expect(TimeoutError).toBeDefined();
      expect(ServiceUnavailableError).toBeDefined();
    });
  });

  describe('ComplianceClient construction', () => {
    test('uses default service URLs when none provided', () => {
      const client = new ComplianceClient({ communicationCompliance: 'http://x' });
      expect((client as any).config.communicationCompliance).toBe('http://x');
      expect((client as any).config.policyEngine).toBe('http://localhost:4181');
      expect((client as any).config.enforcementGateway).toBe('http://localhost:4182');
      expect((client as any).config.llmCompliance).toBe('http://localhost:4183');
      expect((client as any).config.agentGovernance).toBe('http://localhost:4184');
      expect((client as any).config.auditTrail).toBe('http://localhost:4185');
    });

    test('throws ValidationError when no URLs provided', () => {
      expect(() => new ComplianceClient({})).toThrow(ValidationError);
      expect(() => new ComplianceClient({})).toThrow(/at least one service url/i);
    });

    test('accepts custom service URLs', () => {
      const config: SDKConfig = {
        communicationCompliance: 'http://custom:5000',
        policyEngine: 'http://custom:5001',
        enforcementGateway: 'http://custom:5002',
        llmCompliance: 'http://custom:5003',
        agentGovernance: 'http://custom:5004',
        auditTrail: 'http://custom:5005',
      };
      const client = new ComplianceClient(config);
      expect((client as any).config.communicationCompliance).toBe('http://custom:5000');
      expect((client as any).config.auditTrail).toBe('http://custom:5005');
    });

    test('applies default timeout, retries, circuit breaker', () => {
      const client = new ComplianceClient({ communicationCompliance: 'http://x' });
      expect((client as any).timeout).toBe(30000);
      expect((client as any).retries).toBe(3);
      expect((client as any).config.circuitBreaker.enabled).toBe(true);
      expect((client as any).config.circuitBreaker.threshold).toBe(5);
      expect((client as any).config.circuitBreaker.resetTimeout).toBe(60000);
    });

    test('accepts custom timeout and retries', () => {
      const client = new ComplianceClient({
        communicationCompliance: 'http://x',
        timeout: 5000,
        retries: 1,
        apiKey: 'test-key',
      });
      expect((client as any).timeout).toBe(5000);
      expect((client as any).retries).toBe(1);
      expect((client as any).apiKey).toBe('test-key');
    });

    test('exposes all service instances', () => {
      const client = new ComplianceClient({ communicationCompliance: 'http://x' });
      expect(client.communication).toBeDefined();
      expect(client.policy).toBeDefined();
      expect(client.enforcement).toBeDefined();
      expect(client.llm).toBeDefined();
      expect(client.agent).toBeDefined();
      expect(client.audit).toBeDefined();
    });
  });

  describe('Factory functions', () => {
    test('createComplianceClient returns a configured client', () => {
      const client = createComplianceClient({ apiKey: 'k1', communicationCompliance: 'http://x' });
      expect(client).toBeInstanceOf(ComplianceClient);
      expect((client as any).apiKey).toBe('k1');
    });

    test('createSingleServiceClient creates client with only one URL set', () => {
      const client = createSingleServiceClient('communication', 'http://solo:9000');
      expect(client).toBeInstanceOf(ComplianceClient);
      expect((client as any).config.communicationCompliance).toBe('http://solo:9000');
    });

    test('createSingleServiceClient works for each service type', () => {
      const types: Array<'communication' | 'policy' | 'enforcement' | 'llm' | 'agent' | 'audit'> = [
        'communication', 'policy', 'enforcement', 'llm', 'agent', 'audit',
      ];
      types.forEach((type) => {
        const client = createSingleServiceClient(type, `http://${type}:7000`);
        expect(client).toBeInstanceOf(ComplianceClient);
      });
    });
  });

  describe('close()', () => {
    test('close() resolves without error', async () => {
      const client = new ComplianceClient({ communicationCompliance: 'http://x' });
      await expect(client.close()).resolves.toBeUndefined();
    });
  });

  describe('healthCheck()', () => {
    test('healthCheck returns a result object with all 6 services', async () => {
      // We do NOT call the real healthCheck() here because it makes HTTP calls
      // to live services (ports 4180-4185). The integration tests in
      // tests/integration.test.ts cover live health checks; here we just verify
      // that healthCheck() is callable and returns the expected shape by
      // monkey-patching the services' health() to reject immediately.
      const client = new ComplianceClient({ communicationCompliance: 'http://x' });
      const services = [
        client.communication,
        client.policy,
        client.enforcement,
        client.llm,
        client.agent,
        client.audit,
      ];
      // Stub each service's health() to throw (simulating unreachable)
      services.forEach((svc: any) => {
        svc.health = async () => { throw new Error('service unreachable'); };
      });

      const result = await client.healthCheck();
      const expectedKeys = ['communication', 'policy', 'enforcement', 'llm', 'agent', 'audit'];
      expectedKeys.forEach((key) => {
        expect(result).toHaveProperty(key);
        expect(result[key].status).toBe('unhealthy');
      });
    });
  });

  describe('Error classes', () => {
    test('ComplianceError has expected shape', () => {
      const err = new ComplianceError('something failed', 'ERR_CODE', { detail: 'x' });
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('something failed');
      expect(err.code).toBe('ERR_CODE');
      expect(err.details).toEqual({ detail: 'x' });
    });

    test('ValidationError extends ComplianceError', () => {
      const err = new ValidationError('bad input');
      expect(err).toBeInstanceOf(ComplianceError);
      expect(err.message).toBe('bad input');
    });

    test('TimeoutError extends ComplianceError', () => {
      const err = new TimeoutError('svc', 1000);
      expect(err).toBeInstanceOf(ComplianceError);
      expect(err.message).toContain('svc');
      expect(err.message).toContain('1000');
    });

    test('ServiceUnavailableError extends ComplianceError', () => {
      const err = new ServiceUnavailableError('svc', { reason: 'down' });
      expect(err).toBeInstanceOf(ComplianceError);
      expect(err.message).toContain('svc');
    });
  });
});
