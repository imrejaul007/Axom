/**
 * Enforcement Gateway Service
 */

import { BaseService } from './base';
import {
  SDKConfig,
  PreSendValidationRequest,
  EnforcementDecision,
  QuarantineItem,
  EnforcementStats,
} from '../types';

export class EnforcementService extends BaseService {
  constructor(config: SDKConfig, apiKey: string | undefined, timeout: number, retries: number) {
    super(config, apiKey, timeout, retries);
  }

  protected getServiceUrl(): string {
    return this.config.enforcementGateway;
  }

  protected getServiceName(): string {
    return 'Enforcement Gateway';
  }

  /**
   * Pre-send validation - returns immediate decision
   */
  async preSendValidate(request: PreSendValidationRequest): Promise<EnforcementDecision> {
    this.validateRequired(request, ['channel', 'content']);
    return this.post<EnforcementDecision>('/api/enforce/pre-send', request);
  }

  /**
   * Submit content for manual review
   */
  async submitForReview(request: {
    channel: string;
    content: any;
    reason: string;
    submittedBy: string;
  }): Promise<{ quarantineId: string; status: string }> {
    this.validateRequired(request, ['channel', 'content', 'reason', 'submittedBy']);
    return this.post('/api/enforce/review', request);
  }

  /**
   * Get quarantine queue
   */
  async getQuarantineQueue(params?: {
    status?: 'pending' | 'approved' | 'rejected';
    channel?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: QuarantineItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.channel) query.set('channel', params.channel);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.get<{ items: QuarantineItem[]; total: number }>(
      `/api/enforce/quarantine${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get a specific quarantine item
   */
  async getQuarantineItem(quarantineId: string): Promise<QuarantineItem> {
    return this.get<QuarantineItem>(`/api/enforce/quarantine/${quarantineId}`);
  }

  /**
   * Approve a quarantined item
   */
  async approveQuarantined(
    quarantineId: string,
    reviewerId: string,
    notes?: string
  ): Promise<{ approved: boolean; releaseId?: string }> {
    return this.post('/api/enforce/quarantine/approve', {
      quarantineId,
      reviewerId,
      notes,
    });
  }

  /**
   * Reject a quarantined item
   */
  async rejectQuarantined(
    quarantineId: string,
    reviewerId: string,
    reason: string
  ): Promise<{ rejected: boolean }> {
    return this.post('/api/enforce/quarantine/reject', {
      quarantineId,
      reviewerId,
      reason,
    });
  }

  /**
   * Release approved content for sending
   */
  async releaseContent(quarantineId: string): Promise<{ released: boolean }> {
    return this.post('/api/enforce/quarantine/release', { quarantineId });
  }

  /**
   * Get enforcement statistics
   */
  async getStats(): Promise<EnforcementStats> {
    return this.get<EnforcementStats>('/api/enforce/stats');
  }

  /**
   * Set enforcement mode
   */
  async setMode(mode: 'blocking' | 'advisory' | 'audit'): Promise<{ success: boolean }> {
    return this.post('/api/enforce/mode', { mode });
  }

  /**
   * Get current enforcement mode
   */
  async getMode(): Promise<{ mode: 'blocking' | 'advisory' | 'audit' }> {
    return this.get<{ mode: 'blocking' | 'advisory' | 'audit' }>('/api/enforce/mode');
  }

  /**
   * Get blocked content history
   */
  async getBlockedHistory(params?: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    limit?: number;
  }): Promise<{ items: QuarantineItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.channel) query.set('channel', params.channel);
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.get<{ items: QuarantineItem[]; total: number }>(
      `/api/enforce/blocked${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Add custom rule to enforcement engine
   */
  async addRule(rule: {
    id: string;
    name: string;
    channel: string;
    condition: string;
    action: 'block' | 'warn' | 'review';
  }): Promise<{ success: boolean }> {
    return this.post('/api/enforce/rules', rule);
  }

  /**
   * Get custom enforcement rules
   */
  async getRules(): Promise<any[]> {
    return this.get<any[]>('/api/enforce/rules');
  }

  /**
   * Delete custom enforcement rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    return this.delete<void>(`/api/enforce/rules/${ruleId}`);
  }
}
