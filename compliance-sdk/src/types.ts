/**
 * Core type definitions for TrustOS Compliance SDK
 */

// ============ Core Compliance Types ============

export interface ComplianceResult {
  passed: boolean;
  canSend: boolean;
  violations: Violation[];
  warnings: Warning[];
  riskScore: number;
  requiresReview: boolean;
  reviewReason?: string;
  metadata?: Record<string, any>;
}

export interface Violation {
  code: string;
  rule: string;
  regulation?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  matchedContent?: string;
  position?: { start: number; end: number };
  suggestion?: string;
}

export interface Warning {
  code: string;
  rule: string;
  message: string;
  suggestion?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  conditions?: string[];
  expiresAt?: Date;
  boundaries?: AgentBoundaries;
}

// ============ Communication Compliance Types ============

export interface EmailValidationRequest {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

export interface Attachment {
  name: string;
  size: number;
  type?: string;
  hash?: string;
}

export interface DocumentValidationRequest {
  title: string;
  content: string;
  type: 'pdf' | 'word' | 'excel' | 'text' | 'ppt' | 'other';
  metadata?: Record<string, any>;
}

export interface LinkedInValidationRequest {
  content: string;
  hashtags?: string[];
  mentions?: string[];
  visibility: 'public' | 'connections' | 'private';
}

export interface ComplianceRule {
  id: string;
  name: string;
  regulation: 'SEC' | 'FINRA' | 'RBI' | 'COMPANY_POLICY' | 'GDPR' | 'HIPAA' | 'SOX';
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  patterns: string[];
  keywords?: string[];
  action: 'block' | 'warn' | 'review';
  enabled: boolean;
  description: string;
  examples?: string[];
}

// ============ Policy Engine Types ============

export interface Policy {
  id: string;
  name: string;
  version: string;
  source: 'manual' | 'url' | 'file' | 'upload';
  content: string;
  summary?: string;
  ruleCount: number;
  status: 'active' | 'draft' | 'archived';
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ParsePolicyRequest {
  content: string;
  source?: 'manual' | 'url' | 'file';
  metadata?: {
    department?: string;
    effectiveDate?: string;
    version?: string;
  };
}

export interface ExtractedRule {
  id: string;
  policyId: string;
  text: string;
  intent: string;
  conditions?: string[];
  action: 'block' | 'warn' | 'review' | 'allow';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  entities?: string[];
  confidence: number;
}

export interface MachineReadableRule {
  id: string;
  policyId: string;
  rule: {
    when: {
      channel?: string[];
      contentContains?: string[];
      contentMatches?: string[];
      conditions?: Record<string, any>;
    };
    then: {
      action: 'block' | 'warn' | 'review' | 'allow';
      severity?: 'critical' | 'high' | 'medium' | 'low';
      reason: string;
      override?: { requireApproval: boolean; approverRoles?: string[] };
    };
  };
  metadata: {
    sourceText: string;
    confidence: number;
    extractedAt: string;
  };
}

// ============ Enforcement Gateway Types ============

export interface PreSendValidationRequest {
  channel: 'email' | 'linkedin' | 'document' | 'api' | 'chat';
  content: any;
  metadata?: {
    sender?: string;
    recipient?: string;
    timestamp?: string;
    context?: string;
  };
}

export interface EnforcementDecision {
  allowed: boolean;
  mode: 'blocking' | 'advisory' | 'audit';
  violations: Violation[];
  warnings: Warning[];
  riskScore: number;
  quarantineId?: string;
  reviewRequired: boolean;
  reason?: string;
}

export interface QuarantineItem {
  id: string;
  channel: string;
  content: any;
  submittedBy: string;
  submittedAt: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  violations: Violation[];
}

export interface EnforcementStats {
  mode: 'blocking' | 'advisory' | 'audit';
  totalChecks: number;
  blocked: number;
  allowed: number;
  quarantined: number;
  avgRiskScore: number;
  topViolations: { code: string; count: number }[];
  lastUpdated: string;
}

// ============ LLM Compliance Types ============

export interface LLMValidationRequest {
  content: string;
  context?: {
    userId?: string;
    channel?: 'email' | 'chat' | 'document' | 'api';
    purpose?: 'customer_communication' | 'marketing' | 'internal' | 'legal';
    tone?: string;
  };
}

export interface LLMValidationResult extends ComplianceResult {
  piiResults?: {
    detected: boolean;
    types: string[];
    locations: { type: string; position: { start: number; end: number } }[];
  };
  toneResults?: {
    detected: string[];
    expected: string[];
    compliance: 'compliant' | 'non-compliant' | 'unknown';
  };
  policyResults?: {
    violations: Violation[];
    warnings: Warning[];
  };
}

export interface PIICheckResult {
  detected: boolean;
  types: string[];
  count: number;
  locations: { type: string; text: string; position: { start: number; end: number } }[];
}

export interface ToneCheckResult {
  detected: string[];
  expected: string[];
  prohibited: string[];
  compliance: 'compliant' | 'non-compliant' | 'unknown';
  suggestions?: string[];
}

// ============ Agent Governance Types ============

export interface PermissionCheckRequest {
  agentId: string;
  action: string;
  resource?: string;
  context?: {
    purpose?: string;
    urgency?: 'low' | 'medium' | 'high';
    dataTypes?: string[];
  };
}

export interface AgentPermission {
  id: string;
  agentId: string;
  action: string;
  resource?: string;
  conditions?: PermissionCondition[];
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'notIn' | 'contains';
  value: any;
}

export interface AgentBoundaries {
  rateLimit?: { maxActions: number; windowMs: number };
  dataAccess?: { allowedTypes?: string[]; deniedTypes?: string[] };
  timeWindows?: { allowedHours?: { start: string; end: string }; allowedDays?: string[] };
  maxValue?: { field: string; value: number };
  geographicRestrictions?: string[];
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  resource?: string;
  justification: string;
  estimatedImpact?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  conditions?: string[];
  notes?: string;
}

// ============ Audit Trail Types ============

export type EventType =
  | 'MESSAGE_SENT'
  | 'MESSAGE_BLOCKED'
  | 'MESSAGE_REVIEWED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_DENIED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'POLICY_CREATED'
  | 'POLICY_UPDATED'
  | 'RULE_CHANGED'
  | 'SYSTEM_CONFIG'
  | 'USER_ACTION'
  | 'AGENT_ACTION';

export type Outcome = 'SUCCESS' | 'BLOCKED' | 'REVIEW_REQUIRED' | 'ERROR' | 'PARTIAL';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: EventType;
  userId: string;
  userName?: string;
  userRole?: string;
  action: string;
  resource?: string;
  resourceType?: string;
  outcome: Outcome;
  riskScore?: number;
  violations?: Violation[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditQueryParams {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: EventType[];
  users?: string[];
  outcome?: Outcome;
  resourceType?: string;
  limit?: number;
  offset?: number;
}

export interface ComplianceSummary {
  period: { start: string; end: string };
  totalEvents: number;
  byOutcome: Record<Outcome, number>;
  byRiskLevel: { low: number; medium: number; high: number; critical: number };
  topViolations: { code: string; count: number }[];
  topActors: { userId: string; count: number }[];
  trend: { date: string; count: number }[];
}

export interface ViolationTrend {
  period: string;
  groupBy: string;
  trends: { date: string; category: string; count: number }[];
  summary: {
    total: number;
    increase: number;
    mostCommon: string;
  };
}

export interface ExportRequest {
  startDate: Date;
  endDate: Date;
  format: 'csv' | 'json' | 'xlsx';
  filters?: Partial<AuditQueryParams>;
  columns?: string[];
}

export interface ExportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  error?: string;
}

// ============ SDK Configuration Types ============

export interface SDKConfig {
  communicationCompliance?: string;
  policyEngine?: string;
  enforcementGateway?: string;
  llmCompliance?: string;
  agentGovernance?: string;
  auditTrail?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    enabled?: boolean;
    threshold?: number;
    resetTimeout?: number;
  };
}

// ============ React Hook Types ============

export interface UseComplianceCheckResult {
  validate: (data: any) => Promise<ComplianceResult>;
  result: ComplianceResult | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAgentPermissionResult {
  checkPermission: (action: string, resource?: string) => Promise<PermissionResult>;
  hasPermission: boolean;
  loading: boolean;
  error: Error | null;
}

export interface UseAuditLogResult {
  logEvent: (event: Omit<AuditLogEntry, 'id' | 'timestamp'>) => Promise<void>;
  recentEvents: AuditLogEntry[];
  loading: boolean;
  error: Error | null;
}
