/**
 * Agent Governance Service
 */

import { BaseService } from './base';
import {
  SDKConfig,
  PermissionCheckRequest,
  PermissionResult,
  AgentPermission,
  AgentBoundaries,
  ApprovalRequest,
} from '../types';

export class AgentService extends BaseService {
  constructor(config: SDKConfig, apiKey: string | undefined, timeout: number, retries: number) {
    super(config, apiKey, timeout, retries);
  }

  protected getServiceUrl(): string {
    return this.config.agentGovernance;
  }

  protected getServiceName(): string {
    return 'Agent Governance';
  }

  /**
   * Check if an action is allowed for an agent
   */
  async checkPermission(request: PermissionCheckRequest): Promise<PermissionResult> {
    this.validateRequired(request, ['agentId', 'action']);
    return this.post<PermissionResult>('/api/permissions/check', request);
  }

  /**
   * Get all permissions for an agent
   */
  async getAgentPermissions(agentId: string): Promise<AgentPermission[]> {
    return this.get<AgentPermission[]>(`/api/permissions/agent/${agentId}`);
  }

  /**
   * Get all agents
   */
  async getAgents(params?: {
    status?: 'active' | 'inactive';
    limit?: number;
    offset?: number;
  }): Promise<{ agents: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.get<{ agents: any[]; total: number }>(
      `/api/agents${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: {
    id: string;
    name: string;
    type: string;
    description?: string;
    capabilities?: string[];
  }): Promise<{ success: boolean; agentId: string }> {
    this.validateRequired(agent, ['id', 'name', 'type']);
    return this.post('/api/agents', agent);
  }

  /**
   * Update agent details
   */
  async updateAgent(agentId: string, updates: any): Promise<void> {
    return this.put<void>(`/api/agents/${agentId}`, updates);
  }

  /**
   * Deactivate an agent
   */
  async deactivateAgent(agentId: string): Promise<void> {
    return this.delete<void>(`/api/agents/${agentId}`);
  }

  /**
   * Grant permission to an agent
   */
  async grantPermission(permission: {
    agentId: string;
    action: string;
    resource?: string;
    conditions?: any[];
    grantedBy: string;
    expiresAt?: Date;
  }): Promise<AgentPermission> {
    this.validateRequired(permission, ['agentId', 'action', 'grantedBy']);
    return this.post<AgentPermission>('/api/permissions', permission);
  }

  /**
   * Revoke permission from an agent
   */
  async revokePermission(revocation: {
    agentId: string;
    action: string;
    resource?: string;
    revokedBy: string;
  }): Promise<{ success: boolean }> {
    this.validateRequired(revocation, ['agentId', 'action', 'revokedBy']);
    return this.post('/api/permissions/revoke', revocation);
  }

  /**
   * Revoke all permissions for an agent
   */
  async revokeAllPermissions(agentId: string): Promise<{ revoked: number }> {
    return this.delete<{ revoked: number }>(`/api/permissions/agent/${agentId}`);
  }

  /**
   * Request approval for a restricted action
   */
  async requestApproval(request: {
    agentId: string;
    action: string;
    resource?: string;
    justification: string;
    estimatedImpact?: string;
    requestedBy: string;
  }): Promise<ApprovalRequest> {
    this.validateRequired(request, ['agentId', 'action', 'justification', 'requestedBy']);
    return this.post<ApprovalRequest>('/api/approvals/request', request);
  }

  /**
   * Get pending approval queue
   */
  async getApprovalQueue(params?: {
    agentId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ approvals: ApprovalRequest[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.agentId) query.set('agentId', params.agentId);
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.get<{ approvals: ApprovalRequest[]; total: number }>(
      `/api/approvals${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Approve a request
   */
  async approveRequest(
    approvalId: string,
    decision: {
      approverId: string;
      conditions?: string[];
      notes?: string;
      duration?: number;
    }
  ): Promise<{ success: boolean; permissionId?: string }> {
    this.validateRequired(decision, ['approverId']);
    return this.post('/api/approvals/approve', { approvalId, ...decision });
  }

  /**
   * Reject a request
   */
  async rejectRequest(
    approvalId: string,
    decision: {
      approverId: string;
      reason: string;
    }
  ): Promise<{ success: boolean }> {
    this.validateRequired(decision, ['approverId', 'reason']);
    return this.post('/api/approvals/reject', { approvalId, ...decision });
  }

  /**
   * Set agent boundaries
   */
  async setBoundaries(agentId: string, boundaries: AgentBoundaries): Promise<void> {
    return this.put<void>(`/api/agents/${agentId}/boundaries`, boundaries);
  }

  /**
   * Get agent boundaries
   */
  async getBoundaries(agentId: string): Promise<AgentBoundaries> {
    return this.get<AgentBoundaries>(`/api/agents/${agentId}/boundaries`);
  }

  /**
   * Check if agent is within boundaries
   */
  async checkBoundaries(agentId: string): Promise<{
    withinLimits: boolean;
    boundaryStatus: {
      rateLimit?: { current: number; limit: number; remaining: number };
      timeWindow?: { allowed: boolean; currentTime: string };
      dataAccess?: { allowed: boolean; types: string[] };
    };
  }> {
    return this.get(`/api/agents/${agentId}/boundaries/check`);
  }

  /**
   * Get permission statistics
   */
  async getStats(): Promise<{
    totalAgents: number;
    totalPermissions: number;
    pendingApprovals: number;
    recentDenials: number;
    topDeniedActions: { action: string; count: number }[];
  }> {
    return this.get('/api/stats');
  }

  /**
   * Get action history for an agent
   */
  async getActionHistory(agentId: string, params?: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    limit?: number;
  }): Promise<{ actions: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.get<{ actions: any[]; total: number }>(
      `/api/agents/${agentId}/history${queryString ? `?${queryString}` : ''}`
    );
  }
}
