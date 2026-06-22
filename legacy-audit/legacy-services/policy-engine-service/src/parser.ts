/**
 * Policy Parser - Extract rules from policy documents
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Policy,
  GeneratedRule,
  PolicyParseResult,
  PolicyParseRequest,
  NLPPattern,
} from './types.js';

// NLP Patterns for rule extraction
const EXTRACTION_PATTERNS: NLPPattern[] = [
  // Forbidden patterns
  {
    patterns: [
      /must not\s+([^.,]+)/gi,
      /shall not\s+([^.,]+)/gi,
      /will not\s+([^.,]+)/gi,
      /cannot\s+([^.,]+)/gi,
      /prohibited\s+from\s+([^.,]+)/gi,
      /not allowed\s+to\s+([^.,]+)/gi,
      /never\s+([^.,]+)/gi,
      /do not\s+([^.,]+)/gi,
      /don't\s+([^.,]+)/gi,
    ],
    ruleType: 'forbidden',
    severity: 'high',
    action: 'block',
  },

  // Required patterns
  {
    patterns: [
      /must\s+([^.,]+)/gi,
      /shall\s+([^.,]+)/gi,
      /required\s+to\s+([^.,]+)/gi,
      /mandatory\s+([^.,]+)/gi,
      /should\s+always\s+([^.,]+)/gi,
      /always\s+([^.,]+)/gi,
    ],
    ruleType: 'required',
    severity: 'medium',
    action: 'warn',
  },

  // Disclaimer patterns
  {
    patterns: [
      /disclaimer[:\s]+([^.]+)/gi,
      /notwithstanding\s+([^.]+)/gi,
      /subject\s+to\s+([^.]+)/gi,
      /except\s+where\s+([^.]+)/gi,
    ],
    ruleType: 'disclaimer',
    severity: 'low',
    action: 'warn',
  },

  // Conditional patterns
  {
    patterns: [
      /if\s+([^,]+),\s+then\s+([^.]+)/gi,
      /whenever\s+([^,]+),\s+([^.]+)/gi,
      /in\s+case\s+of\s+([^,]+),\s+([^.]+)/gi,
    ],
    ruleType: 'conditional',
    severity: 'medium',
    action: 'review',
  },
];

// Keyword mappings for severity and action
const KEYWORD_MAPPINGS = {
  critical: {
    keywords: ['guarantee', 'promise', 'assure', 'risk-free', '100%', 'never fail'],
    severity: 'critical' as const,
    action: 'block' as const,
  },
  high: {
    keywords: ['must not', 'prohibited', 'forbidden', 'cannot', 'disallowed'],
    severity: 'high' as const,
    action: 'block' as const,
  },
  medium: {
    keywords: ['should', 'recommended', 'advised', 'preferable'],
    severity: 'medium' as const,
    action: 'warn' as const,
  },
  low: {
    keywords: ['may', 'could', 'optional', 'alternative'],
    severity: 'low' as const,
    action: 'warn' as const,
  },
};

export class PolicyParser {
  /**
   * Parse policy document and extract rules
   */
  parse(request: PolicyParseRequest): PolicyParseResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const rules: GeneratedRule[] = [];

    // Validate input
    if (!request.content || request.content.trim().length === 0) {
      errors.push('Policy content is required');
      return {
        success: false,
        rules: [],
        warnings,
        errors,
        statistics: {
          totalRules: 0,
          forbiddenRules: 0,
          requiredRules: 0,
          conditionalRules: 0,
          disclaimerRules: 0,
        },
      };
    }

    if (!request.name) {
      errors.push('Policy name is required');
      return {
        success: false,
        rules: [],
        warnings,
        errors,
        statistics: {
          totalRules: 0,
          forbiddenRules: 0,
          requiredRules: 0,
          conditionalRules: 0,
          disclaimerRules: 0,
        },
      };
    }

    // Extract rules from content
    const extractedRules = this.extractRules(request.content);

    // Process extracted rules
    for (const extracted of extractedRules) {
      const rule = this.createRuleFromExtracted(extracted, request);
      if (rule) {
        rules.push(rule);
      }
    }

    // Generate warnings for ambiguous content
    const ambiguousPhrases = this.detectAmbiguousPhrases(request.content);
    warnings.push(...ambiguousPhrases);

    // Create policy object
    const policy: Policy = {
      id: uuidv4(),
      name: request.name,
      description: request.description || '',
      type: request.type,
      source: 'parsed',
      content: request.content,
      version: request.version || '1.0',
      effectiveDate: new Date(),
      rules,
      metadata: {
        author: request.metadata?.author,
        department: request.metadata?.department,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      policy,
      rules,
      warnings,
      errors,
      statistics: this.calculateStatistics(rules),
    };
  }

  /**
   * Extract rules from policy text using NLP patterns
   */
  private extractRules(content: string): ExtractedRule[] {
    const extracted: ExtractedRule[] = [];
    const contentLower = content.toLowerCase();

    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    for (const sentence of sentences) {
      const sentenceTrimmed = sentence.trim();
      const sentenceLower = sentenceTrimmed.toLowerCase();

      // Check against each pattern type
      for (const pattern of EXTRACTION_PATTERNS) {
        for (const regex of pattern.patterns) {
          const matches = sentenceTrimmed.matchAll(new RegExp(regex.source, regex.flags));

          for (const match of matches) {
            extracted.push({
              text: match[0],
              captured: match[1] || match[0],
              ruleType: pattern.ruleType,
              baseSeverity: pattern.severity,
              baseAction: pattern.action,
              position: match.index || 0,
            });
          }
        }
      }

      // Check for specific keywords
      for (const [severity, config] of Object.entries(KEYWORD_MAPPINGS)) {
        for (const keyword of config.keywords) {
          if (sentenceLower.includes(keyword)) {
            // Avoid duplicates
            if (!extracted.some(e => e.text === sentenceTrimmed)) {
              extracted.push({
                text: sentenceTrimmed,
                captured: sentenceTrimmed,
                ruleType: 'forbidden',
                baseSeverity: severity as 'critical' | 'high' | 'medium' | 'low',
                baseAction: config.action,
                position: contentLower.indexOf(sentenceLower),
              });
            }
          }
        }
      }
    }

    return extracted;
  }

  /**
   * Create GeneratedRule from extracted text
   */
  private createRuleFromExtracted(
    extracted: ExtractedRule,
    request: PolicyParseRequest
  ): GeneratedRule | null {
    // Clean up captured text
    const cleanedText = this.cleanRuleText(extracted.captured);

    if (cleanedText.length < 3) return null;

    // Generate patterns from text
    const patterns = this.generatePatterns(cleanedText);

    // Determine severity based on keywords
    const severity = this.determineSeverity(extracted.text);

    return {
      id: uuidv4(),
      policyId: '', // Will be set when policy is created
      name: this.generateRuleName(cleanedText, extracted.ruleType),
      description: `Extracted from policy: ${request.name}`,
      type: extracted.ruleType,
      patterns,
      severity,
      action: this.determineAction(extracted.text, severity),
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Clean rule text for pattern matching
   */
  private cleanRuleText(text: string): string {
    return text
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Generate patterns from rule text
   */
  private generatePatterns(text: string): string[] {
    const patterns: string[] = [];
    const words = text.split(/\s+/);

    // Exact phrase
    patterns.push(text);

    // Key phrases (remove common words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'to', 'from', 'of', 'in', 'on'];
    const keyWords = words.filter(w => !stopWords.includes(w) && w.length > 2);

    if (keyWords.length >= 2) {
      patterns.push(keyWords.join(' '));
    }

    // Individual keywords
    if (keyWords.length >= 3) {
      patterns.push(...keyWords.slice(0, 5));
    }

    return [...new Set(patterns)]; // Deduplicate
  }

  /**
   * Generate human-readable rule name
   */
  private generateRuleName(text: string, ruleType: string): string {
    const ruleTypeNames: Record<string, string> = {
      forbidden: 'Prohibit',
      required: 'Require',
      conditional: 'Conditional',
      disclaimer: 'Disclaimer for',
    };

    const prefix = ruleTypeNames[ruleType] || 'Rule';
    const truncated = text.length > 50 ? text.slice(0, 50) + '...' : text;

    return `${prefix}: ${truncated}`;
  }

  /**
   * Determine severity based on keywords
   */
  private determineSeverity(text: string): 'critical' | 'high' | 'medium' | 'low' {
    const textLower = text.toLowerCase();

    for (const [severity, config] of Object.entries(KEYWORD_MAPPINGS)) {
      for (const keyword of config.keywords) {
        if (textLower.includes(keyword)) {
          return severity as 'critical' | 'high' | 'medium' | 'low';
        }
      }
    }

    return 'medium';
  }

  /**
   * Determine action based on context
   */
  private determineAction(
    text: string,
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): 'block' | 'warn' | 'review' {
    const textLower = text.toLowerCase();

    // Forbidden patterns should block
    if (textLower.includes('must not') || textLower.includes('shall not') || textLower.includes('prohibited')) {
      return 'block';
    }

    // Critical severity should block
    if (severity === 'critical') return 'block';

    // High severity should review
    if (severity === 'high') return 'review';

    return 'warn';
  }

  /**
   * Detect ambiguous phrases that may need human review
   */
  private detectAmbiguousPhrases(content: string): string[] {
    const warnings: string[] = [];
    const ambiguousPatterns = [
      { pattern: /reasonable\s+(?:efforts?|care)/gi, message: 'Contains vague "reasonable efforts" language' },
      { pattern: /as\s+appropriate/gi, message: 'Contains vague "as appropriate" language' },
      { pattern: /timely\s+(?:manner|basis)/gi, message: 'Contains vague "timely" language' },
      { pattern: /best\s+(?:practices?|judgment)/gi, message: 'Contains vague "best practices" language' },
    ];

    for (const { pattern, message } of ambiguousPatterns) {
      if (pattern.test(content)) {
        warnings.push(message + ' - may need clarification');
      }
    }

    return warnings;
  }

  /**
   * Calculate rule statistics
   */
  private calculateStatistics(rules: GeneratedRule[]) {
    return {
      totalRules: rules.length,
      forbiddenRules: rules.filter(r => r.type === 'forbidden').length,
      requiredRules: rules.filter(r => r.type === 'required').length,
      conditionalRules: rules.filter(r => r.type === 'conditional').length,
      disclaimerRules: rules.filter(r => r.type === 'disclaimer').length,
    };
  }
}

interface ExtractedRule {
  text: string;
  captured: string;
  ruleType: string;
  baseSeverity: 'critical' | 'high' | 'medium' | 'low';
  baseAction: 'block' | 'warn' | 'review';
  position: number;
}

// Singleton export
export const policyParser = new PolicyParser();
