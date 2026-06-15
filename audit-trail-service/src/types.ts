/**
 * Audit Trail Types
 */

export type AuditEventType =
  | 'compliance_check'
  | 'violation_detected'
  | 'action_blocked'
  | 'action_allowed'
  | 'action_quarantined'
  | 'policy_created'
  | 'policy_updated'
  | 'rule_created'
  | 'rule_updated'
  | 'rule_deleted'
  | 'agent_registered'
  | 'agent_action'
  | 'permission_check'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'export_request'
  | 'erasure_request';

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: Date;
  actor: {
    id: string;
    type: 'user' | 'agent' | 'system';
    name?: string;
  };
  target?: {
    id: string;
    type: string;
    name?: string;
  };
  action: string;
  outcome: 'success' | 'failure' | 'blocked';
  details: Record<string, unknown>;
  violations?: ViolationDetail[];
  riskScore?: number;
  metadata?: Record<string, unknown>;
}

export interface ViolationDetail {
  ruleId: string;
  ruleName: string;
  regulation: string;
  severity: Severity;
  matchedText?: string;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  types?: AuditEventType[];
  actorIds?: string[];
  actorTypes?: ('user' | 'agent' | 'system')[];
  outcomes?: ('success' | 'failure' | 'blocked')[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  name: string;
  type: 'compliance' | 'activity' | 'violations' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEvents: number;
    byType: Record<string, number>;
    byOutcome: Record<string, number>;
    bySeverity: Record<string, number>;
    riskScore?: number;
  };
  events: AuditEvent[];
  generatedAt: Date;
}

export interface ComplianceSummary {
  period: { start: Date; end: Date };
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  blockedActions: number;
  violationsByRegulation: Record<string, number>;
  topViolations: Array<{ rule: string; count: number }>;
  riskScore: number;
}
