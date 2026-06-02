/**
 * Communication Compliance Service
 */

import { BaseService } from './base';
import { SDKConfig, ComplianceResult, ComplianceRule, EmailValidationRequest, DocumentValidationRequest, LinkedInValidationRequest } from '../types';

export class CommunicationService extends BaseService {
  constructor(config: SDKConfig, apiKey: string | undefined, timeout: number, retries: number) {
    super(config, apiKey, timeout, retries);
  }

  protected getServiceUrl(): string {
    return this.config.communicationCompliance;
  }

  protected getServiceName(): string {
    return 'Communication Compliance';
  }

  /**
   * Validate an email before sending
   */
  async validateEmail(request: EmailValidationRequest): Promise<ComplianceResult> {
    this.validateRequired(request, ['to', 'subject', 'body']);
    return this.post<ComplianceResult>('/api/validate/email', request);
  }

  /**
   * Validate a document
   */
  async validateDocument(request: DocumentValidationRequest): Promise<ComplianceResult> {
    this.validateRequired(request, ['title', 'content', 'type']);
    return this.post<ComplianceResult>('/api/validate/document', request);
  }

  /**
   * Validate a LinkedIn post
   */
  async validateLinkedIn(request: LinkedInValidationRequest): Promise<ComplianceResult> {
    this.validateRequired(request, ['content', 'visibility']);
    return this.post<ComplianceResult>('/api/validate/linkedin', request);
  }

  /**
   * Get all compliance rules
   */
  async getRules(): Promise<{ rules: ComplianceRule[]; total: number }> {
    return this.get<{ rules: ComplianceRule[]; total: number }>('/api/rules');
  }

  /**
   * Get a specific rule by ID
   */
  async getRule(ruleId: string): Promise<ComplianceRule> {
    return this.get<ComplianceRule>(`/api/rules/${ruleId}`);
  }

  /**
   * Add a new compliance rule
   */
  async addRule(rule: Omit<ComplianceRule, 'id'>): Promise<ComplianceRule> {
    return this.post<ComplianceRule>('/api/rules', rule);
  }

  /**
   * Update an existing rule
   */
  async updateRule(ruleId: string, rule: Partial<ComplianceRule>): Promise<ComplianceRule> {
    return this.put<ComplianceRule>(`/api/rules/${ruleId}`, rule);
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    return this.delete<void>(`/api/rules/${ruleId}`);
  }

  /**
   * Check content against a specific regulation
   */
  async checkRegulation(
    regulation: 'SEC' | 'FINRA' | 'RBI' | 'COMPANY_POLICY',
    content: { content: string; context?: Record<string, any> }
  ): Promise<{ violations: any[]; warnings: any[] }> {
    return this.post(`/api/check/${regulation.toLowerCase()}`, content);
  }

  /**
   * Get compliance statistics
   */
  async getStats(): Promise<{
    totalChecks: number;
    blocked: number;
    allowed: number;
    topViolations: { code: string; count: number }[];
  }> {
    return this.get('/api/stats');
  }

  /**
   * Bulk validate multiple emails
   */
  async bulkValidateEmails(requests: EmailValidationRequest[]): Promise<ComplianceResult[]> {
    return this.post<ComplianceResult[]>('/api/validate/email/bulk', { emails: requests });
  }
}
