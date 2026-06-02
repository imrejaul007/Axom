/**
 * Audit Trail Service
 */

import { BaseService } from './base';
import {
  SDKConfig,
  AuditLogEntry,
  AuditQueryParams,
  ComplianceSummary,
  ViolationTrend,
  ExportRequest,
  ExportStatus,
  EventType,
  Outcome,
} from '../types';

export class AuditService extends BaseService {
  constructor(config: SDKConfig, apiKey: string | undefined, timeout: number, retries: number) {
    super(config, apiKey, timeout, retries);
  }

  protected getServiceUrl(): string {
    return this.config.auditTrail;
  }

  protected getServiceName(): string {
    return 'Audit Trail';
  }

  /**
   * Log a compliance event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<{ id: string; timestamp: string }> {
    this.validateRequired(entry, ['eventType', 'userId', 'action', 'outcome']);
    return this.post('/api/audit/log', entry);
  }

  /**
   * Query audit logs with filters
   */
  async query(params: AuditQueryParams): Promise<{ logs: AuditLogEntry[]; total: number; hasMore: boolean }> {
    const query = new URLSearchParams();

    if (params.startDate) query.set('startDate', params.startDate.toISOString());
    if (params.endDate) query.set('endDate', params.endDate.toISOString());
    if (params.eventTypes?.length) query.set('eventTypes', params.eventTypes.join(','));
    if (params.users?.length) query.set('users', params.users.join(','));
    if (params.outcome) query.set('outcome', params.outcome);
    if (params.resourceType) query.set('resourceType', params.resourceType);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.get<{ logs: AuditLogEntry[]; total: number; hasMore: boolean }>(
      `/api/audit/query${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get a specific log entry by ID
   */
  async getLog(logId: string): Promise<AuditLogEntry> {
    return this.get<AuditLogEntry>(`/api/audit/${logId}`);
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(
    userId: string,
    params?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<{ activities: AuditLogEntry[]; summary: Record<string, number> }> {
    const query = new URLSearchParams();

    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.get(`/api/audit/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get compliance summary for a period
   */
  async getComplianceSummary(params: {
    period: '7d' | '30d' | '90d' | '1y' | 'custom';
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<ComplianceSummary> {
    return this.post('/api/audit/summary', params);
  }

  /**
   * Generate compliance report
   */
  async generateReport(request: {
    startDate: Date;
    endDate: Date;
    format: 'pdf' | 'csv' | 'json';
    sections?: ('summary' | 'violations' | 'approvals' | 'permissions' | 'timeline')[];
    includeCharts?: boolean;
    filters?: Partial<AuditQueryParams>;
  }): Promise<{
    reportId: string;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: string;
  }> {
    return this.post('/api/audit/report/generate', request);
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<{
    reportId: string;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    return this.get(`/api/audit/report/${reportId}`);
  }

  /**
   * Get violation trends
   */
  async getViolationTrends(params: {
    period: '7d' | '30d' | '90d' | '1y';
    groupBy?: 'day' | 'week' | 'month';
    categories?: string[];
  }): Promise<ViolationTrend> {
    return this.post('/api/audit/trends/violations', params);
  }

  /**
   * Get top violations
   */
  async getTopViolations(params: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    groupBy?: 'code' | 'category' | 'user' | 'severity';
  }): Promise<{ violations: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate.toISOString());
    if (params.endDate) query.set('endDate', params.endDate.toISOString());
    if (params.limit) query.set('limit', String(params.limit));
    if (params.groupBy) query.set('groupBy', params.groupBy);

    const queryString = query.toString();
    return this.get(`/api/audit/violations/top${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Export audit logs
   */
  async exportLogs(request: ExportRequest): Promise<{ exportId: string; status: string }> {
    return this.post('/api/audit/export', {
      ...request,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
    });
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<ExportStatus> {
    return this.get<ExportStatus>(`/api/audit/export/${exportId}`);
  }

  /**
   * Download exported file
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${this.getServiceUrl()}/api/audit/export/${exportId}/download`, {
      headers: {
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Export download failed: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Get real-time compliance stream (SSE)
   */
  streamComplianceEvents(params?: {
    eventTypes?: EventType[];
    users?: string[];
  }): EventSource {
    const query = new URLSearchParams();
    if (params?.eventTypes?.length) query.set('eventTypes', params.eventTypes.join(','));
    if (params?.users?.length) query.set('users', params.users.join(','));

    const queryString = query.toString();
    return new EventSource(`${this.getServiceUrl()}/api/audit/stream${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    todayEvents: number;
    todayBlocked: number;
    pendingApprovals: number;
    activeAgents: number;
    topViolations: { code: string; count: number }[];
    recentAlerts: AuditLogEntry[];
  }> {
    return this.get('/api/audit/dashboard');
  }

  /**
   * Archive old logs
   */
  async archiveLogs(beforeDate: Date): Promise<{ archived: number; deleted: number }> {
    return this.post('/api/audit/archive', { beforeDate: beforeDate.toISOString() });
  }

  /**
   * Get event type statistics
   */
  async getEventStats(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Record<EventType, number>> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());

    const queryString = query.toString();
    return this.get(`/api/audit/stats/events${queryString ? `?${queryString}` : ''}`);
  }
}
