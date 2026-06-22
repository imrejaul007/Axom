/**
 * Content Validator - Channel-specific validation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ComplianceCheckRequest,
  ComplianceCheckResult,
  Violation,
  RewriteSuggestion,
  Channel,
  ContentType,
  ViolationAction,
} from './types.js';
import { RuleEngine, ruleEngine } from './ruleEngine.js';

export class ContentValidator {
  private ruleEngine: RuleEngine;

  constructor(ruleEngine?: RuleEngine) {
    this.ruleEngine = ruleEngine || ruleEngine;
  }

  /**
   * Validate content for a specific channel
   */
  async validate(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    const startTime = Date.now();
    const id = uuidv4();

    // Preprocess content based on channel
    const processedContent = this.preprocess(request.content, request.channel);

    // Check content against rules
    const regulations = this.getApplicableRegulations(request.channel);
    const { violations, riskScore, riskLevel, action } = this.ruleEngine.checkDetailed(
      processedContent,
      regulations
    );

    // Generate rewrite suggestions
    const rewriteSuggestions = this.generateRewriteSuggestions(violations);

    // Add channel-specific checks
    const channelWarnings = this.channelSpecificCheck(request);

    return {
      id,
      passed: action === 'allow',
      violations,
      warnings: [...channelWarnings],
      riskScore,
      riskLevel,
      action,
      checkedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
      rewriteSuggestions,
    };
  }

  /**
   * Preprocess content based on channel
   */
  preprocess(content: string, channel: Channel): string {
    let processed = content;

    // Remove HTML tags for text analysis
    if (channel === 'email' || channel === 'document') {
      processed = this.stripHtml(processed);
    }

    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // Remove URLs for privacy in logs (but keep them for URL-specific checks)
    // processed = processed.replace(/https?:\/\/[^\s]+/g, '[URL]');

    return processed;
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Get applicable regulations for channel
   */
  private getApplicableRegulations(channel: Channel): ('SEC' | 'FINRA' | 'RBI' | 'COMPANY_POLICY')[] {
    // All channels get basic regulations
    const basic = ['COMPANY_POLICY'] as const;

    switch (channel) {
      case 'email':
        return [...basic, 'SEC', 'FINRA', 'RBI'];
      case 'linkedin':
        return [...basic, 'SEC', 'FINRA', 'RBI'];
      case 'document':
        return [...basic, 'SEC', 'FINRA', 'RBI'];
      case 'chat':
        return [...basic, 'RBI'];
      case 'api':
        return [...basic, 'RBI'];
      default:
        return basic;
    }
  }

  /**
   * Channel-specific compliance checks
   */
  private channelSpecificCheck(request: ComplianceCheckRequest): string[] {
    const warnings: string[] = [];

    switch (request.channel) {
      case 'email':
        if (!request.sender?.email) {
          warnings.push('Email missing sender address');
        }
        if (!request.recipient?.email) {
          warnings.push('Email missing recipient address');
        }
        if (!this.hasUnsubscribe(request.content)) {
          warnings.push('Marketing email missing unsubscribe link');
        }
        break;

      case 'linkedin':
        if (this.hasPhoneNumber(request.content)) {
          warnings.push('LinkedIn post contains phone number');
        }
        if (this.hasEmailAddress(request.content)) {
          warnings.push('LinkedIn post contains email address');
        }
        break;

      case 'document':
        if (!this.hasDate(request.content)) {
          warnings.push('Document missing date');
        }
        if (!this.hasVersion(request.content)) {
          warnings.push('Document missing version number');
        }
        break;
    }

    return warnings;
  }

  /**
   * Check if content has unsubscribe link
   */
  private hasUnsubscribe(content: string): boolean {
    const lower = content.toLowerCase();
    return lower.includes('unsubscribe') || lower.includes('opt-out') || lower.includes('opt out');
  }

  /**
   * Check if content has phone number
   */
  private hasPhoneNumber(content: string): boolean {
    return /\d{10,}/.test(content);
  }

  /**
   * Check if content has email address
   */
  private hasEmailAddress(content: string): boolean {
    return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content);
  }

  /**
   * Check if content has date
   */
  private hasDate(content: string): boolean {
    return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(content) ||
           /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(content);
  }

  /**
   * Check if content has version
   */
  private hasVersion(content: string): boolean {
    return /v\d+(\.\d+)*/i.test(content) || /version\s*\d+/i.test(content);
  }

  /**
   * Generate rewrite suggestions for violations
   */
  private generateRewriteSuggestions(violations: Violation[]): RewriteSuggestion[] {
    return violations.map(v => ({
      original: v.matchedText,
      replacement: this.getReplacement(v),
      reason: v.suggestion || 'Rewrite to comply with regulations',
      violationId: v.id,
    }));
  }

  /**
   * Get replacement text for violation
   */
  private getReplacement(violation: Violation): string {
    const replacements: Record<string, string> = {
      'guaranteed return': 'potential return',
      'guaranteed profit': 'potential profit',
      'will make you': 'may help you',
      'will earn': 'historically earned',
      'no risk': 'managed risk',
      'risk free': 'low risk',
      'safe investment': 'diversified investment',
      'we guarantee': 'we strive to',
      'i made': '[Testimonial removed]',
      'unlike competitor': '[Competitor reference removed]',
    };

    const lower = violation.matchedText.toLowerCase();
    for (const [phrase, replacement] of Object.entries(replacements)) {
      if (lower.includes(phrase)) {
        return replacement;
      }
    }

    return `[Review: ${violation.ruleName}]`;
  }
}

// Singleton export
export const contentValidator = new ContentValidator();
