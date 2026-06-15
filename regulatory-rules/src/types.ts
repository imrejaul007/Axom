/**
 * Regulatory Rules Type Definitions
 */

export type RegulationType = 'SEC' | 'FINRA' | 'RBI' | 'COMPANY_POLICY' | 'GDPR' | 'HIPAA' | 'SOX';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type Action = 'block' | 'warn' | 'review' | 'allow';

export interface RulePattern {
  type: 'regex' | 'keyword' | 'phrase' | 'pattern';
  value: string;
  flags?: string;
  description?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  regulation: RegulationType;
  category: string;
  subcategory?: string;
  severity: Severity;
  patterns: (string | RulePattern)[];
  action: Action;
  enabled: boolean;
  description: string;
  guidance?: string;
  examples?: {
    trigger?: string;
    compliant?: string;
    nonCompliant?: string;
  };
  references?: {
    title: string;
    url: string;
    section?: string;
  }[];
  effectiveDate?: string;
  lastUpdated?: string;
}

export interface RuleSet {
  name: string;
  regulation: RegulationType;
  description: string;
  rules: ComplianceRule[];
  version: string;
  effectiveDate: string;
}

export interface ValidationContext {
  content: string;
  channel?: 'email' | 'document' | 'chat' | 'linkedin' | 'api';
  userId?: string;
  userRole?: string;
  department?: string;
  jurisdiction?: string;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  warnings: Warning[];
  riskScore: number;
  matchedRules: {
    rule: ComplianceRule;
    match: {
      type: string;
      value: string;
      position: { start: number; end: number };
    };
  }[];
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  description: string;
  matchedContent: string;
  position: { start: number; end: number };
  suggestion?: string;
}

export interface Warning {
  ruleId: string;
  ruleName: string;
  message: string;
  suggestion?: string;
}

/**
 * Create a custom rule with proper typing
 */
export function createCustomRule(
  partial: Partial<ComplianceRule> & Pick<ComplianceRule, 'id' | 'name' | 'regulation' | 'patterns' | 'action'>
): ComplianceRule {
  return {
    id: partial.id,
    name: partial.name,
    regulation: partial.regulation || 'COMPANY_POLICY',
    category: partial.category || 'general',
    severity: partial.severity || 'medium',
    patterns: partial.patterns,
    action: partial.action,
    enabled: partial.enabled ?? true,
    description: partial.description || '',
    ...partial,
  };
}
