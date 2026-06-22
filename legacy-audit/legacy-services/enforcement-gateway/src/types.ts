/**
 * Enforcement Gateway Types
 */

export type EnforcementAction = 'allow' | 'block' | 'quarantine' | 'review';
export type EnforcementMode = 'blocking' | 'advisory' | 'audit';
export type ContentChannel = 'email' | 'sms' | 'chat' | 'api' | 'document';

export interface EnforcementRequest {
  id: string;
  content: string;
  channel: ContentChannel;
  sender: {
    id: string;
    type: 'user' | 'agent' | 'system';
    name?: string;
  };
  recipient?: {
    id?: string;
    type?: 'user' | 'group' | 'broadcast';
    name?: string;
  };
  context?: {
    agentId?: string;
    templateId?: string;
    campaignId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, unknown>;
  };
  timestamp: Date;
}

export interface EnforcementResult {
  id: string;
  requestId: string;
  action: EnforcementAction;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: EnforcementViolation[];
  processingTimeMs: number;
  timestamp: Date;
  expiresAt?: Date;
  approvedBy?: string;
  overrideReason?: string;
}

export interface EnforcementViolation {
  id: string;
  type: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedText?: string;
  suggestion?: string;
}

export interface QuarantinedItem {
  id: string;
  request: EnforcementRequest;
  reason: string;
  violations: EnforcementViolation[];
  quarantinedAt: Date;
  quarantinedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface EnforcementConfig {
  mode: EnforcementMode;
  timeout: number;
  maxContentSize: number;
  enableQuarantine: boolean;
  quarantineRetentionDays: number;
  notificationSettings: {
    notifyOnBlock: boolean;
    notifyOnQuarantine: boolean;
    notifyOnReview: boolean;
    webhookUrl?: string;
  };
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxContentLength: number;
}

export interface CachedRule {
  id: string;
  patterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: EnforcementAction;
  expiresAt: number;
}
