/**
 * Communication Compliance Types
 */

export type Channel = 'email' | 'linkedin' | 'document' | 'chat' | 'api';
export type ContentType = 'text' | 'html' | 'markdown';

export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ViolationAction = 'block' | 'warn' | 'review' | 'allow';

export type Regulation =
  | 'SEC'
  | 'FINRA'
  | 'GDPR'
  | 'HIPAA'
  | 'RBI'
  | 'SEBI'
  | 'DPDP'
  | 'COMPANY_POLICY'
  | 'CUSTOM';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulation: Regulation;
  severity: ViolationSeverity;
  action: ViolationAction;
  patterns: string[];
  regex?: RegExp[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Violation {
  id: string;
  ruleId: string;
  ruleName: string;
  regulation: Regulation;
  severity: ViolationSeverity;
  matchedText: string;
  position: { start: number; end: number };
  suggestion?: string;
  explanation: string;
}

export interface ComplianceCheckRequest {
  content: string;
  channel: Channel;
  contentType: ContentType;
  sender?: {
    id: string;
    name: string;
    email?: string;
  };
  recipient?: {
    id: string;
    name: string;
    email?: string;
  };
  context?: {
    templateId?: string;
    campaignId?: string;
    agentId?: string;
    metadata?: Record<string, unknown>;
  };
  userId?: string;
}

export interface ComplianceCheckResult {
  id: string;
  passed: boolean;
  violations: Violation[];
  warnings: string[];
  riskScore: number;
  riskLevel: ViolationSeverity;
  action: ViolationAction;
  checkedAt: Date;
  processingTimeMs: number;
  rewriteSuggestions?: RewriteSuggestion[];
}

export interface RewriteSuggestion {
  original: string;
  replacement: string;
  reason: string;
  violationId: string;
}

export interface ValidationResponse {
  success: boolean;
  data?: ComplianceCheckResult;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    processingTimeMs: number;
  };
}

export interface ChannelValidator {
  validate(request: ComplianceCheckRequest): Promise<ComplianceCheckResult>;
  preprocess(content: string): string;
}

export interface RuleEngine {
  check(content: string): Violation[];
  getRules(): ComplianceRule[];
  addRule(rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): ComplianceRule;
  removeRule(id: string): boolean;
  enableRule(id: string): boolean;
  disableRule(id: string): boolean;
}
