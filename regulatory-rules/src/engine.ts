/**
 * Rule Engine for Regulatory Compliance
 * Core validation engine for checking content against compliance rules
 */

import {
  ComplianceRule,
  RulePattern,
  ValidationContext,
  ValidationResult,
  Violation,
  Warning,
  Severity,
} from './types';

/**
 * Severity scoring weights
 */
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

/**
 * Rule Validation Engine
 */
export class RuleEngine {
  private compiledRules: Map<string, RegExp[]> = new Map();

  /**
   * Compile rules for efficient matching
   */
  compileRules(rules: ComplianceRule[]): void {
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const patterns: RegExp[] = [];
      for (const pattern of rule.patterns) {
        if (typeof pattern === 'string') {
          try {
            patterns.push(new RegExp(pattern, 'gi'));
          } catch (e) {
            console.warn(`Invalid regex pattern in rule ${rule.id}: ${pattern}`);
          }
        } else if (pattern.type === 'regex' || pattern.type === 'pattern') {
          try {
            patterns.push(new RegExp(pattern.value, pattern.flags || 'gi'));
          } catch (e) {
            console.warn(`Invalid regex pattern in rule ${rule.id}: ${pattern.value}`);
          }
        }
        // For keywords and phrases, we'll match them as-is
        else if (pattern.type === 'keyword' || pattern.type === 'phrase') {
          const escaped = pattern.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          try {
            patterns.push(new RegExp(escaped, 'gi'));
          } catch (e) {
            console.warn(`Invalid keyword pattern in rule ${rule.id}: ${pattern.value}`);
          }
        }
      }
      this.compiledRules.set(rule.id, patterns);
    }
  }

  /**
   * Validate content against a set of rules
   */
  validate(content: string, rules: ComplianceRule[], context?: ValidationContext): ValidationResult {
    const violations: Violation[] = [];
    const warnings: Warning[] = [];
    const matchedRules: ValidationResult['matchedRules'] = [];
    let riskScore = 0;

    // Compile rules if not already compiled
    if (this.compiledRules.size === 0) {
      this.compileRules(rules);
    }

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const compiledPatterns = this.compiledRules.get(rule.id);
      if (!compiledPatterns) continue;

      for (const pattern of compiledPatterns) {
        pattern.lastIndex = 0; // Reset regex state
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(content)) !== null) {
          const matchText = match[0];

          // Calculate position
          const position = {
            start: match.index,
            end: match.index + matchText.length,
          };

          // Add to matched rules
          matchedRules.push({
            rule,
            match: {
              type: 'pattern',
              value: matchText,
              position,
            },
          });

          // Create violation or warning based on action
          const violation: Violation = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            description: rule.description,
            matchedContent: matchText,
            position,
            suggestion: rule.examples?.compliant,
          };

          if (rule.action === 'block') {
            violations.push(violation);
            riskScore += SEVERITY_WEIGHTS[rule.severity];
          } else if (rule.action === 'warn' || rule.action === 'review') {
            warnings.push({
              ruleId: rule.id,
              ruleName: rule.name,
              message: rule.description,
              suggestion: rule.examples?.compliant,
            });
            riskScore += SEVERITY_WEIGHTS[rule.severity] * 0.5;
          }

          // Prevent infinite loops on zero-width matches
          if (match[0].length === 0) {
            pattern.lastIndex++;
          }
        }
      }
    }

    // Normalize risk score to 0-1 range
    riskScore = Math.min(riskScore / (rules.length * 0.5), 1.0);

    // Determine if passed
    const passed = violations.length === 0;

    return {
      passed,
      violations,
      warnings,
      riskScore,
      matchedRules,
    };
  }

  /**
   * Validate with context-aware rules
   */
  validateContextAware(
    content: string,
    rules: ComplianceRule[],
    context: ValidationContext
  ): ValidationResult {
    // Filter rules based on context
    const applicableRules = this.filterRulesByContext(rules, context);

    return this.validate(content, applicableRules, context);
  }

  /**
   * Filter rules based on validation context
   */
  private filterRulesByContext(rules: ComplianceRule[], context: ValidationContext): ComplianceRule[] {
    return rules.filter(rule => {
      // Always include if no specific context filters
      if (!context.channel && !context.userRole && !context.department && !context.jurisdiction) {
        return true;
      }

      // Filter by channel (example: some rules only apply to specific channels)
      if (context.channel) {
        // Add channel-specific logic here if needed
      }

      // Filter by jurisdiction (example: SEC rules only for US jurisdiction)
      if (context.jurisdiction === 'US' && rule.regulation === 'RBI') {
        return false;
      }
      if (context.jurisdiction === 'INDIA' && rule.regulation === 'SEC') {
        return false;
      }

      return true;
    });
  }

  /**
   * Batch validate multiple content items
   */
  batchValidate(
    items: { content: string; context?: ValidationContext }[],
    rules: ComplianceRule[]
  ): ValidationResult[] {
    return items.map(item => this.validateContextAware(item.content, rules, item.context || {}));
  }

  /**
   * Get statistics about matched rules
   */
  getMatchStatistics(result: ValidationResult): {
    bySeverity: Record<Severity, number>;
    byRegulation: Record<string, number>;
    topRules: { ruleId: string; count: number }[];
  } {
    const bySeverity: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byRegulation: Record<string, number> = {};
    const ruleCounts: Record<string, number> = {};

    for (const match of result.matchedRules) {
      bySeverity[match.rule.severity]++;
      byRegulation[match.rule.regulation] = (byRegulation[match.rule.regulation] || 0) + 1;
      ruleCounts[match.rule.id] = (ruleCounts[match.rule.id] || 0) + 1;
    }

    const topRules = Object.entries(ruleCounts)
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { bySeverity, byRegulation, topRules };
  }
}

/**
 * Factory function to create a pre-configured rule engine
 */
export function createRuleEngine(rules?: ComplianceRule[]): RuleEngine {
  const engine = new RuleEngine();
  if (rules) {
    engine.compileRules(rules);
  }
  return engine;
}

/**
 * Quick validation helper
 */
export function quickValidate(
  content: string,
  rules: ComplianceRule[]
): { passed: boolean; violations: number; warnings: number } {
  const engine = new RuleEngine();
  const result = engine.validate(content, rules);

  return {
    passed: result.passed,
    violations: result.violations.length,
    warnings: result.warnings.length,
  };
}
