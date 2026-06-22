/**
 * TrustOS Compliance SDK Client
 */

import { SDKConfig, ComplianceResult, PermissionResult, AuditLogEntry } from './types';
import { CommunicationService } from './services/communication';
import { PolicyService } from './services/policy';
import { EnforcementService } from './services/enforcement';
import { LLMService } from './services/llm';
import { AgentService } from './services/agent';
import { AuditService } from './services/audit';
import { ComplianceError, ServiceUnavailableError, ValidationError } from './errors';

export class ComplianceClient {
  public communication: CommunicationService;
  public policy: PolicyService;
  public enforcement: EnforcementService;
  public llm: LLMService;
  public agent: AgentService;
  public audit: AuditService;

  private config: Required<SDKConfig>;
  private apiKey?: string;
  private timeout: number;
  private retries: number;

  constructor(config: SDKConfig) {
    this.validateConfig(config);

    this.config = {
      communicationCompliance: config.communicationCompliance || 'http://localhost:4180',
      policyEngine: config.policyEngine || 'http://localhost:4181',
      enforcementGateway: config.enforcementGateway || 'http://localhost:4182',
      llmCompliance: config.llmCompliance || 'http://localhost:4183',
      agentGovernance: config.agentGovernance || 'http://localhost:4184',
      auditTrail: config.auditTrail || 'http://localhost:4185',
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      circuitBreaker: config.circuitBreaker || { enabled: true, threshold: 5, resetTimeout: 60000 },
    };

    this.apiKey = this.config.apiKey;
    this.timeout = this.config.timeout;
    this.retries = this.config.retries;

    // Initialize service clients
    this.communication = new CommunicationService(this.config, this.apiKey, this.timeout, this.retries);
    this.policy = new PolicyService(this.config, this.apiKey, this.timeout, this.retries);
    this.enforcement = new EnforcementService(this.config, this.apiKey, this.timeout, this.retries);
    this.llm = new LLMService(this.config, this.apiKey, this.timeout, this.retries);
    this.agent = new AgentService(this.config, this.apiKey, this.timeout, this.retries);
    this.audit = new AuditService(this.config, this.apiKey, this.timeout, this.retries);
  }

  private validateConfig(config: SDKConfig): void {
    const urls = [
      config.communicationCompliance,
      config.policyEngine,
      config.enforcementGateway,
      config.llmCompliance,
      config.agentGovernance,
      config.auditTrail,
    ];

    const activeUrls = urls.filter(Boolean);
    if (activeUrls.length === 0) {
      throw new ValidationError('At least one service URL must be provided');
    }
  }

  /**
   * Check health of all connected services
   */
  async healthCheck(): Promise<Record<string, { status: string; latency?: number }>> {
    const results: Record<string, { status: string; latency?: number }> = {};

    const checks = [
      { name: 'communication', service: this.communication },
      { name: 'policy', service: this.policy },
      { name: 'enforcement', service: this.enforcement },
      { name: 'llm', service: this.llm },
      { name: 'agent', service: this.agent },
      { name: 'audit', service: this.audit },
    ];

    for (const check of checks) {
      const start = Date.now();
      try {
        await (check.service as any).health();
        results[check.name] = { status: 'healthy', latency: Date.now() - start };
      } catch (error) {
        results[check.name] = { status: 'unhealthy' };
      }
    }

    return results;
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    // Cleanup resources if needed
  }
}

/**
 * Factory function to create a pre-configured client
 */
export function createComplianceClient(config: SDKConfig): ComplianceClient {
  return new ComplianceClient(config);
}

/**
 * Create a minimal client for a single service
 */
export function createSingleServiceClient<T>(
  serviceType: 'communication' | 'policy' | 'enforcement' | 'llm' | 'agent' | 'audit',
  url: string,
  apiKey?: string
): any {
  const config: SDKConfig = { apiKey };

  switch (serviceType) {
    case 'communication':
      config.communicationCompliance = url;
      break;
    case 'policy':
      config.policyEngine = url;
      break;
    case 'enforcement':
      config.enforcementGateway = url;
      break;
    case 'llm':
      config.llmCompliance = url;
      break;
    case 'agent':
      config.agentGovernance = url;
      break;
    case 'audit':
      config.auditTrail = url;
      break;
  }

  return new ComplianceClient(config);
}
