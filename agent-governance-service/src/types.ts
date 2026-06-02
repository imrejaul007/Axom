/**
 * Agent Governance Types
 */

export type AgentType = 'customer_support' | 'sales' | 'marketing' | 'hr' | 'finance' | 'operations' | 'custom';
export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval';

export type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'send_message'
  | 'make_api_call'
  | 'access_data'
  | 'modify_record'
  | 'delete_record'
  | 'create_record'
  | 'share_data'
  | 'external_call';

export type PermissionDecision = 'allow' | 'deny' | 'review' | 'block';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  permissions: AgentPermission[];
  roles: string[];
  boundaries: AgentBoundary[];
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
}

export interface AgentPermission {
  id: string;
  action: ActionType;
  resource?: string;
  conditions?: PermissionCondition[];
  decision: PermissionDecision;
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: string | number | boolean | string[];
}

export interface AgentBoundary {
  id: string;
  type: 'rate_limit' | 'data_access' | 'action_limit' | 'time_window';
  config: {
    limit?: number;
    window?: string;
    allowedResources?: string[];
    deniedResources?: string[];
    allowedHours?: string[];
    maxValue?: number;
  };
  action?: ActionType;
}

export interface ActionRequest {
  id: string;
  agentId: string;
  action: ActionType;
  resource?: string;
  payload?: Record<string, unknown>;
  context: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: Date;
}

export interface ActionDecision {
  requestId: string;
  decision: PermissionDecision;
  reason: string;
  conditions?: {
    field: string;
    value: unknown;
    actual: unknown;
  }[];
  requiresApproval?: boolean;
  approverRole?: string;
  expiresAt?: Date;
  processingTimeMs: number;
}

export interface AuditLog {
  id: string;
  agentId: string;
  action: ActionType;
  decision: PermissionDecision;
  resource?: string;
  payload?: Record<string, unknown>;
  context: Record<string, unknown>;
  reason: string;
  timestamp: Date;
  duration?: number;
  error?: string;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: ActionType;
  payload: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Omit<AgentPermission, 'id'>[];
  boundaries: Omit<AgentBoundary, 'id'>[];
}
