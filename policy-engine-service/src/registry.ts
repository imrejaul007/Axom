/**
 * Rule Registry - Manage and query generated rules
 */

import { v4 as uuidv4 } from 'uuid';
import type { Policy, GeneratedRule, PolicyType, RuleType } from './types.js';

export class RuleRegistry {
  private policies: Map<string, Policy> = new Map();
  private rules: Map<string, GeneratedRule> = new Map();

  /**
   * Add policy and its rules
   */
  addPolicy(policy: Policy): Policy {
    // Set policy ID on rules
    policy.rules.forEach(rule => {
      rule.policyId = policy.id;
      this.rules.set(rule.id, rule);
    });

    this.policies.set(policy.id, policy);
    return policy;
  }

  /**
   * Get policy by ID
   */
  getPolicy(id: string): Policy | undefined {
    return this.policies.get(id);
  }

  /**
   * Get all policies
   */
  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policies by type
   */
  getPoliciesByType(type: PolicyType): Policy[] {
    return Array.from(this.policies.values()).filter(p => p.type === type);
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): GeneratedRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all rules
   */
  getAllRules(): GeneratedRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by policy ID
   */
  getRulesByPolicy(policyId: string): GeneratedRule[] {
    return Array.from(this.rules.values()).filter(r => r.policyId === policyId);
  }

  /**
   * Get rules by type
   */
  getRulesByType(type: RuleType): GeneratedRule[] {
    return Array.from(this.rules.values()).filter(r => r.type === type);
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): GeneratedRule[] {
    return Array.from(this.rules.values()).filter(r => r.enabled);
  }

  /**
   * Enable rule
   */
  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Disable rule
   */
  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<GeneratedRule>): GeneratedRule | null {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date() });
      return rule;
    }
    return null;
  }

  /**
   * Delete policy and its rules
   */
  deletePolicy(policyId: string): boolean {
    const policy = this.policies.get(policyId);
    if (policy) {
      // Delete all rules for this policy
      policy.rules.forEach(rule => {
        this.rules.delete(rule.id);
      });
      this.policies.delete(policyId);
      return true;
    }
    return false;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Search rules by keyword
   */
  searchRules(keyword: string): GeneratedRule[] {
    const keywordLower = keyword.toLowerCase();
    return Array.from(this.rules.values()).filter(rule =>
      rule.name.toLowerCase().includes(keywordLower) ||
      rule.description.toLowerCase().includes(keywordLower) ||
      rule.patterns.some(p => p.toLowerCase().includes(keywordLower))
    );
  }

  /**
   * Get rule statistics
   */
  getStatistics(): {
    totalPolicies: number;
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    byType: Record<RuleType, number>;
    bySeverity: Record<string, number>;
    byPolicy: Record<string, number>;
  } {
    const rules = Array.from(this.rules.values());

    return {
      totalPolicies: this.policies.size,
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      disabledRules: rules.filter(r => !r.enabled).length,
      byType: {
        forbidden: rules.filter(r => r.type === 'forbidden').length,
        required: rules.filter(r => r.type === 'required').length,
        conditional: rules.filter(r => r.type === 'conditional').length,
        disclaimer: rules.filter(r => r.type === 'disclaimer').length,
      },
      bySeverity: {
        critical: rules.filter(r => r.severity === 'critical').length,
        high: rules.filter(r => r.severity === 'high').length,
        medium: rules.filter(r => r.severity === 'medium').length,
        low: rules.filter(r => r.severity === 'low').length,
      },
      byPolicy: Object.fromEntries(
        Array.from(this.policies.keys()).map(id => [
          id,
          rules.filter(r => r.policyId === id).length
        ])
      ),
    };
  }

  /**
   * Export all rules as compliance format
   */
  exportRules(): {
    policies: Policy[];
    rules: GeneratedRule[];
    exportedAt: Date;
    version: string;
  } {
    return {
      policies: Array.from(this.policies.values()),
      rules: Array.from(this.rules.values()),
      exportedAt: new Date(),
      version: '1.0',
    };
  }

  /**
   * Import rules from compliance format
   */
  importRules(data: {
    policies: Policy[];
    rules: GeneratedRule[];
  }): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    for (const policy of data.policies) {
      try {
        this.addPolicy({
          ...policy,
          id: uuidv4(), // Generate new ID
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        imported++;
      } catch (error) {
        errors.push(`Failed to import policy ${policy.name}: ${error}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Clear all policies and rules
   */
  clear(): void {
    this.policies.clear();
    this.rules.clear();
  }
}

// Singleton export
export const ruleRegistry = new RuleRegistry();
