/**
 * LLM Compliance Service
 */

import { BaseService } from './base';
import {
  SDKConfig,
  LLMValidationRequest,
  LLMValidationResult,
  PIICheckResult,
  ToneCheckResult,
} from '../types';

export class LLMService extends BaseService {
  constructor(config: SDKConfig, apiKey: string | undefined, timeout: number, retries: number) {
    super(config, apiKey, timeout, retries);
  }

  protected getServiceUrl(): string {
    return this.config.llmCompliance;
  }

  protected getServiceName(): string {
    return 'LLM Compliance';
  }

  /**
   * Full validation of AI-generated content
   */
  async validate(request: LLMValidationRequest): Promise<LLMValidationResult> {
    this.validateRequired(request, ['content']);
    return this.post<LLMValidationResult>('/api/llm/validate', request);
  }

  /**
   * Check for PII in content
   */
  async checkPII(content: string): Promise<PIICheckResult> {
    return this.post<PIICheckResult>('/api/llm/pii', { content });
  }

  /**
   * Check tone of content
   */
  async checkTone(request: {
    content: string;
    expectedTones?: string[];
    prohibitedTones?: string[];
  }): Promise<ToneCheckResult> {
    this.validateRequired(request, ['content']);
    return this.post<ToneCheckResult>('/api/llm/tone', request);
  }

  /**
   * Validate content against company policies
   */
  async validatePolicies(content: string): Promise<{
    violations: any[];
    warnings: any[];
    riskScore: number;
  }> {
    return this.post('/api/llm/policies', { content });
  }

  /**
   * Check regulatory compliance
   */
  async checkRegulatory(content: string, regulation?: string): Promise<{
    compliant: boolean;
    violations: any[];
    regulation?: string;
  }> {
    return this.post('/api/llm/regulatory', { content, regulation });
  }

  /**
   * Generate compliance report for content
   */
  async generateReport(content: string, options?: {
    includePII?: boolean;
    includeTone?: boolean;
    includePolicy?: boolean;
    includeRegulatory?: boolean;
  }): Promise<{
    content: string;
    pii?: PIICheckResult;
    tone?: ToneCheckResult;
    policy?: { violations: any[]; warnings: any[] };
    regulatory?: { violations: any[]; regulation: string };
    overallRisk: number;
    recommendations: string[];
  }> {
    return this.post('/api/llm/report', { content, options: options || {} });
  }

  /**
   * Sanitize content by masking PII
   */
  async sanitize(content: string, piiTypes?: string[]): Promise<{
    sanitized: string;
    maskedCount: number;
    maskedTypes: string[];
  }> {
    return this.post('/api/llm/sanitize', { content, piiTypes });
  }

  /**
   * Rewrite content to comply with policies
   */
  async rewrite(request: {
    content: string;
    instructions?: string;
    preserveMeaning?: boolean;
  }): Promise<{
    original: string;
    rewritten: string;
    changes: { type: string; description: string }[];
  }> {
    this.validateRequired(request, ['content']);
    return this.post('/api/llm/rewrite', request);
  }

  /**
   * Get configured tone profiles
   */
  async getToneProfiles(): Promise<{ profile: string; description: string; allowed: boolean }[]> {
    return this.get('/api/llm/tone/profiles');
  }

  /**
   * Update tone profile settings
   */
  async updateToneProfile(profile: string, allowed: boolean): Promise<void> {
    return this.put('/api/llm/tone/profiles', { profile, allowed });
  }

  /**
   * Get LLM validation statistics
   */
  async getStats(): Promise<{
    totalValidations: number;
    piiDetections: number;
    toneViolations: number;
    policyViolations: number;
    avgRiskScore: number;
  }> {
    return this.get('/api/llm/stats');
  }
}
