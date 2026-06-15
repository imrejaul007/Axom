/**
 * Policy Engine Service
 */

import { BaseService } from './base';
import { SDKConfig, Policy, ParsePolicyRequest, ExtractedRule, MachineReadableRule } from '../types';

export class PolicyService extends BaseService {
  constructor(config: SDKConfig, apiKey: string | undefined, timeout: number, retries: number) {
    super(config, apiKey, timeout, retries);
  }

  protected getServiceUrl(): string {
    return this.config.policyEngine;
  }

  protected getServiceName(): string {
    return 'Policy Engine';
  }

  /**
   * Parse a policy document and extract rules
   */
  async parsePolicy(request: ParsePolicyRequest): Promise<{
    policy: Policy;
    rules: ExtractedRule[];
    summary: string;
  }> {
    this.validateRequired(request, ['content']);
    return this.post('/api/policies/parse', request);
  }

  /**
   * Get all policies
   */
  async getPolicies(params?: {
    status?: 'active' | 'draft' | 'archived';
    limit?: number;
    offset?: number;
  }): Promise<{ policies: Policy[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.get<{ policies: Policy[]; total: number }>(
      `/api/policies${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get a specific policy by ID
   */
  async getPolicy(policyId: string): Promise<Policy> {
    return this.get<Policy>(`/api/policies/${policyId}`);
  }

  /**
   * Update a policy
   */
  async updatePolicy(policyId: string, updates: Partial<Policy>): Promise<Policy> {
    return this.put<Policy>(`/api/policies/${policyId}`, updates);
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    return this.delete<void>(`/api/policies/${policyId}`);
  }

  /**
   * Get extracted rules for a policy
   */
  async getExtractedRules(policyId: string): Promise<ExtractedRule[]> {
    return this.get<ExtractedRule[]>(`/api/policies/${policyId}/rules`);
  }

  /**
   * Generate machine-readable rules from a policy
   */
  async generateRules(policyId: string): Promise<MachineReadableRule[]> {
    return this.post<MachineReadableRule[]>(`/api/policies/${policyId}/generate-rules`, {});
  }

  /**
   * Re-parse a policy with updated content
   */
  async reparsePolicy(policyId: string, content: string): Promise<{
    policy: Policy;
    rules: ExtractedRule[];
    changes: { added: number; removed: number; modified: number };
  }> {
    return this.post(`/api/policies/${policyId}/reparse`, { content });
  }

  /**
   * Check content against all applicable policies
   */
  async checkCompliance(content: string): Promise<{
    compliant: boolean;
    violatedPolicies: { policyId: string; policyName: string; violations: any[] }[];
  }> {
    return this.post('/api/compliance/check', { content });
  }

  /**
   * Get policy categories
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    return this.get<{ category: string; count: number }[]>('/api/policies/categories');
  }

  /**
   * Get policy statistics
   */
  async getStats(): Promise<{
    totalPolicies: number;
    activePolicies: number;
    totalRules: number;
    byCategory: Record<string, number>;
  }> {
    return this.get('/api/policies/stats');
  }

  /**
   * Export policy rules in various formats
   */
  async exportRules(
    policyId: string,
    format: 'json' | 'yaml' | 'xml'
  ): Promise<string> {
    return this.post<string>(`/api/policies/${policyId}/export`, { format });
  }

  /**
   * Import rules from external format
   */
  async importRules(
    rules: MachineReadableRule[],
    targetPolicyId?: string
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    return this.post('/api/policies/import-rules', { rules, targetPolicyId });
  }
}
