/**
 * Policy Engine Types
 */

export type PolicyType =
  | 'compliance'
  | 'security'
  | 'privacy'
  | 'hr'
  | 'operations'
  | 'finance'
  | 'legal';

export type RuleType =
  | 'forbidden'
  | 'required'
  | 'conditional'
  | 'disclaimer';

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  source: string;
  content: string;
  version: string;
  effectiveDate: Date;
  expiryDate?: Date;
  rules: GeneratedRule[];
  metadata: {
    author?: string;
    department?: string;
    approver?: string;
    approvedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedRule {
  id: string;
  policyId: string;
  name: string;
  description: string;
  type: RuleType;
  patterns: string[];
  regex?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'block' | 'warn' | 'review';
  conditions?: RuleCondition[];
  disclaimer?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists' | 'greater_than' | 'less_than';
  value: string | number | boolean;
  connector?: 'AND' | 'OR';
}

export interface PolicyParseRequest {
  name: string;
  description?: string;
  type: PolicyType;
  content: string;
  version?: string;
  metadata?: {
    author?: string;
    department?: string;
  };
}

export interface PolicyParseResult {
  success: boolean;
  policy?: Policy;
  rules: GeneratedRule[];
  warnings: string[];
  errors: string[];
  statistics: {
    totalRules: number;
    forbiddenRules: number;
    requiredRules: number;
    conditionalRules: number;
    disclaimerRules: number;
  };
}

export interface PolicyValidationRequest {
  content: string;
  policies: string[];
  context?: Record<string, unknown>;
}

export interface PolicyValidationResult {
  content: string;
  violations: PolicyViolation[];
  passed: boolean;
  riskScore: number;
  checkedPolicies: string[];
  checkedAt: Date;
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  policyId: string;
  policyName: string;
  matchedText: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'block' | 'warn' | 'review';
  suggestion?: string;
}

export interface NLPPattern {
  patterns: RegExp[];
  ruleType: RuleType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'block' | 'warn' | 'review';
  extractGroups?: string[];
}
