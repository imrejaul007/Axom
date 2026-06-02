/**
 * Rule Engine - Core compliance rule checking
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ComplianceRule,
  Violation,
  ViolationSeverity,
  Regulation,
} from './types.js';
import { ALL_RULES, RULES_BY_REGULATION } from './rules/index.js';

export class RuleEngine {
  private rules: Map<string, ComplianceRule> = new Map();
  private enabledRegulations: Set<Regulation> = new Set(['SEC', 'FINRA', 'RBI', 'COMPANY_POLICY']);

  constructor() {
    // Load default rules
    for (const rule of ALL_RULES) {
      if (rule.enabled) {
        this.rules.set(rule.id, rule);
      }
    }
  }

  /**
   * Check content against all enabled rules
   */
  check(content: string, regulations?: Regulation[]): Violation[] {
    const violations: Violation[] = [];
    const contentLower = content.toLowerCase();
    const rulesToCheck = regulations
      ? regulations.flatMap(r => RULES_BY_REGULATION[r] || [])
      : Array.from(this.rules.values());

    for (const rule of rulesToCheck) {
      if (!this.rules.has(rule.id)) continue;
      if (!this.enabledRegulations.has(rule.regulation)) continue;

      for (const pattern of rule.patterns) {
        const patternLower = pattern.toLowerCase();
        let index = contentLower.indexOf(patternLower);

        while (index !== -1) {
          violations.push(this.createViolation(rule, content.substring(index, index + pattern.length), index));

          // Check for overlapping matches
          index = contentLower.indexOf(patternLower, index + 1);

          // Limit to 5 matches per rule to avoid spam
          if (violations.filter(v => v.ruleId === rule.id).length >= 5) break;
        }
      }
    }

    // Deduplicate violations at same position
    return this.deduplicateViolations(violations);
  }

  /**
   * Check content and return detailed result
   */
  checkDetailed(content: string, regulations?: Regulation[]): {
    violations: Violation[];
    riskScore: number;
    riskLevel: ViolationSeverity;
    action: 'block' | 'warn' | 'review' | 'allow';
  } {
    const violations = this.check(content, regulations);

    // Calculate risk score
    let riskScore = 0;
    for (const v of violations) {
      switch (v.severity) {
        case 'critical': riskScore += 40; break;
        case 'high': riskScore += 25; break;
        case 'medium': riskScore += 15; break;
        case 'low': riskScore += 5; break;
      }
    }

    riskScore = Math.min(100, riskScore);

    // Determine risk level
    let riskLevel: ViolationSeverity = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else if (riskScore >= 10) riskLevel = 'low';

    // Determine action
    let action: 'block' | 'warn' | 'review' | 'allow' = 'allow';
    if (violations.some(v => v.severity === 'critical')) action = 'block';
    else if (violations.some(v => v.severity === 'high')) action = 'review';
    else if (violations.length > 0) action = 'warn';

    return { violations, riskScore, riskLevel, action };
  }

  /**
   * Create violation object
   */
  private createViolation(rule: ComplianceRule, matchedText: string, position: number): Violation {
    return {
      id: uuidv4(),
      ruleId: rule.id,
      ruleName: rule.name,
      regulation: rule.regulation,
      severity: rule.severity,
      matchedText,
      position: { start: position, end: position + matchedText.length },
      suggestion: this.getSuggestion(rule, matchedText),
      explanation: `${rule.name}: ${rule.description}`,
    };
  }

  /**
   * Get rewrite suggestion for violation
   */
  private getSuggestion(rule: ComplianceRule, matchedText: string): string {
    const suggestions: Record<string, string> = {
      'sec-001': 'Remove guarantee language. Use "may" or "potentially" instead.',
      'sec-002': 'Include risk disclosure: "Investments involve risk of loss."',
      'sec-003': 'Remove testimonial. Use general language instead.',
      'sec-004': 'Add disclaimer: "Past performance does not guarantee future results."',
      'sec-005': 'Remove superlative claims. Be factual.',
      'sec-006': 'Add disclaimer: "This is not investment advice."',
      'finra-001': 'Use neutral language. Avoid recommendation statements.',
      'finra-002': 'Add suitability note: "Based on your profile."',
      'finra-003': 'Provide full disclosure of relevant information.',
      'finra-004': 'Include full fee breakdown.',
      'finra-005': 'Use measured language. Avoid sensationalism.',
      'policy-001': 'Remove competitor references.',
      'policy-002': 'Use professional language.',
      'policy-003': 'Do not share confidential information.',
      'policy-004': 'Add: "Subject to terms and conditions."',
      'policy-005': 'Include official pricing or link to pricing page.',
      'rbi-001': 'Add security advisory: "Never share OTP or passwords."',
      'rbi-002': 'RBI guidelines prohibit such claims.',
      'rbi-003': 'Include complete terms and conditions.',
    };

    return suggestions[rule.id] || `Review compliance with ${rule.regulation} ${rule.name}`;
  }

  /**
   * Deduplicate violations at same position
   */
  private deduplicateViolations(violations: Violation[]): Violation[] {
    const seen = new Map<string, Violation>();

    for (const v of violations) {
      const key = `${v.ruleId}-${v.position.start}`;
      if (!seen.has(key)) {
        seen.set(key, v);
      } else {
        // Keep the more severe violation
        const existing = seen.get(key)!;
        const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
        if (severityOrder.indexOf(v.severity) < severityOrder.indexOf(existing.severity)) {
          seen.set(key, v);
        }
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.position.start - b.position.start);
  }

  /**
   * Get all enabled rules
   */
  getRules(regulations?: Regulation[]): ComplianceRule[] {
    const rules = Array.from(this.rules.values());
    if (regulations) {
      return rules.filter(r => regulations.includes(r.regulation));
    }
    return rules;
  }

  /**
   * Add a custom rule
   */
  addRule(rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): ComplianceRule {
    const newRule: ComplianceRule = {
      ...rule,
      id: `custom-${uuidv4().slice(0, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Remove rule by ID
   */
  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  /**
   * Enable a rule
   */
  enableRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Disable a rule
   */
  disableRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Enable/disable entire regulation
   */
  setRegulationEnabled(regulation: Regulation, enabled: boolean): void {
    if (enabled) {
      this.enabledRegulations.add(regulation);
    } else {
      this.enabledRegulations.delete(regulation);
    }
  }

  /**
   * Get enabled regulations
   */
  getEnabledRegulations(): Regulation[] {
    return Array.from(this.enabledRegulations);
  }
}

// Singleton export
export const ruleEngine = new RuleEngine();
