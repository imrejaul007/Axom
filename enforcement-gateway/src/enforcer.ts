/**
 * Real-time Enforcer - Core enforcement logic
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EnforcementRequest,
  EnforcementResult,
  EnforcementAction,
  EnforcementViolation,
  EnforcementMode,
} from './types.js';
import { QuarantineQueue, quarantineQueue } from './quarantine.js';

// Default violation patterns
const VIOLATION_PATTERNS = [
  // Critical patterns
  { pattern: /guaranteed\s+return/i, type: 'SEC_VIOLATION', severity: 'critical' as const },
  { pattern: /risk[\s-]?free/i, type: 'SEC_VIOLATION', severity: 'critical' as const },
  { pattern: /100%\s+return/i, type: 'SEC_VIOLATION', severity: 'critical' as const },
  { pattern: /must\s+not\s+disclose/i, type: 'CONFIDENTIALITY', severity: 'critical' as const },

  // High severity
  { pattern: /account\s+will\s+be\s+blocked/i, type: 'FRAUD_INDICATOR', severity: 'high' as const },
  { pattern: /verify\s+your\s+(?:account|kyc)/i, type: 'PHISHING', severity: 'high' as const },
  { pattern: /otp\s+(?:share|tell|give)/i, type: 'FRAUD_INDICATOR', severity: 'high' as const },
  { pattern: /unauthorized\s+access/i, type: 'SECURITY_ALERT', severity: 'high' as const },

  // Medium severity
  { pattern: /urgent\s+action/i, type: 'URGENCY_TACTIC', severity: 'medium' as const },
  { pattern: /limited\s+time/i, type: 'PRESSURE_TACTIC', severity: 'medium' as const },
  { pattern: /win\s+(?:prize|lottery)/i, type: 'SCAM_INDICATOR', severity: 'medium' as const },

  // Low severity
  { pattern: /click\s+here/i, type: 'LINK_TACTIC', severity: 'low' as const },
  { pattern: /act\s+now/i, type: 'PRESSURE_TACTIC', severity: 'low' as const },
];

export class Enforcer {
  private quarantineQueue: QuarantineQueue;
  private mode: EnforcementMode;

  constructor(mode: EnforcementMode = 'blocking') {
    this.quarantineQueue = quarantineQueue;
    this.mode = mode;
  }

  /**
   * Enforce content
   */
  async enforce(request: EnforcementRequest): Promise<EnforcementResult> {
    const startTime = Date.now();
    const id = uuidv4();

    // Check content against patterns
    const violations = this.checkContent(request.content);

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
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';

    // Determine action based on mode and violations
    let action: EnforcementAction = 'allow';

    if (violations.length > 0) {
      const hasCritical = violations.some(v => v.severity === 'critical');
      const hasHigh = violations.some(v => v.severity === 'high');

      switch (this.mode) {
        case 'blocking':
          if (hasCritical) {
            action = 'block';
          } else if (hasHigh) {
            action = 'quarantine';
          } else {
            action = 'review';
          }
          break;

        case 'advisory':
          action = violations.length > 0 ? 'review' : 'allow';
          break;

        case 'audit':
          action = 'allow';
          break;
      }
    }

    // Handle quarantine
    if (action === 'quarantine') {
      this.quarantineQueue.add(
        request,
        `Risk score: ${riskScore}, Violations: ${violations.length}`,
        violations,
        'system'
      );
    }

    const result: EnforcementResult = {
      id: uuidv4(),
      requestId: request.id,
      action,
      riskScore,
      riskLevel,
      violations,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    };

    // Add quarantine info if applicable
    if (action === 'quarantine') {
      result.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    return result;
  }

  /**
   * Check content for violations
   */
  private checkContent(content: string): EnforcementViolation[] {
    const violations: EnforcementViolation[] = [];
    const contentLower = content.toLowerCase();

    for (const { pattern, type, severity } of VIOLATION_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          id: uuidv4(),
          type,
          rule: pattern.source,
          severity,
          matchedText: match[0],
          suggestion: this.getSuggestion(type),
        });
      }
    }

    // Deduplicate by type
    const seen = new Set<string>();
    return violations.filter(v => {
      if (seen.has(v.type)) return false;
      seen.add(v.type);
      return true;
    });
  }

  /**
   * Get suggestion for violation type
   */
  private getSuggestion(type: string): string {
    const suggestions: Record<string, string> = {
      SEC_VIOLATION: 'Remove or rephrase to comply with SEC regulations',
      FRAUD_INDICATOR: 'This phrase is commonly used in fraud - verify authenticity',
      PHISHING: 'This may be a phishing attempt - verify sender',
      SECURITY_ALERT: 'Review for security compliance',
      URGENCY_TACTIC: 'Consider removing urgency language',
      PRESSURE_TACTIC: 'Consider removing pressure language',
      SCAM_INDICATOR: 'This phrase is commonly used in scams',
      LINK_TACTIC: 'Ensure link destination is verified',
      CONFIDENTIALITY: 'Do not disclose confidential information',
    };

    return suggestions[type] || 'Review for compliance';
  }

  /**
   * Set enforcement mode
   */
  setMode(mode: EnforcementMode): void {
    this.mode = mode;
  }

  /**
   * Get current mode
   */
  getMode(): EnforcementMode {
    return this.mode;
  }
}

// Singleton
export const enforcer = new Enforcer();
