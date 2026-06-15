/**
 * Content Validators - Multi-layer validation
 */

import type { LLMIssue, ToneAnalysis, PIICheck, RewriteSuggestion } from './types.js';

// PII Patterns
const PII_PATTERNS: Array<{ type: string; pattern: RegExp; mask: string }> = [
  { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, mask: '[EMAIL]' },
  { type: 'phone', pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, mask: '[PHONE]' },
  { type: 'ssn', pattern: /\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/g, mask: '[SSN]' },
  { type: 'credit_card', pattern: /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/g, mask: '[CARD]' },
  { type: 'aadhaar', pattern: /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/g, mask: '[AADHAAR]' },
  { type: 'pan', pattern: /[A-Z]{5}[0-9]{4}[A-Z]/g, mask: '[PAN]' },
];

// Regulatory violation patterns
const REGULATORY_PATTERNS: Array<{
  id: string;
  regulation: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
}> = [
  {
    id: 'sec-001',
    regulation: 'SEC',
    pattern: /guaranteed\s+(?:return|profit)/gi,
    severity: 'critical',
    description: 'Cannot guarantee investment returns',
    suggestion: 'Use "may" or "historically" instead',
  },
  {
    id: 'sec-002',
    regulation: 'SEC',
    pattern: /risk[\s-]?free/gi,
    severity: 'critical',
    description: 'Cannot claim risk-free investments',
    suggestion: 'Include risk disclosure',
  },
  {
    id: 'finra-001',
    regulation: 'FINRA',
    pattern: /100%\s+(?:profit|return|gain)/gi,
    severity: 'high',
    description: 'Cannot promise 100% returns',
    suggestion: 'Remove percentage promises',
  },
  {
    id: 'finra-002',
    regulation: 'FINRA',
    pattern: /best\s+(?:investment|fund|choice)/gi,
    severity: 'high',
    description: 'Cannot claim best performance',
    suggestion: 'Use comparative language instead',
  },
  {
    id: 'pii-001',
    regulation: 'Privacy',
    pattern: /my\s+(?:password|pin|otp|secret)/gi,
    severity: 'critical',
    description: 'Requesting sensitive credentials',
    suggestion: 'Never request sensitive information',
  },
  {
    id: 'safety-001',
    regulation: 'Safety',
    pattern: /(?:click|visit|go\s+to)\s+(?:here|now)/gi,
    severity: 'medium',
    description: 'Generic call-to-action without context',
    suggestion: 'Be specific about destination',
  },
];

// Tone indicators
const TONE_PATTERNS: Record<string, { pattern: RegExp; weight: number }[]> = {
  aggressive: [
    { pattern: /(!{2,}|DO NOT|IMMEDIATELY|MUST|WILL DEFINITELY)/g, weight: 0.8 },
    { pattern: /(?:you\s+must|you\s+have\s+to|required\s+to)/gi, weight: 0.4 },
  ],
  friendly: [
    { pattern: /(?:please|thank\s+you|appreciate|happy\s+to)/gi, weight: 0.6 },
    { pattern: /(?:great|wonderful|excellent|amazing)/gi, weight: 0.4 },
  ],
  professional: [
    { pattern: /(?:regards|sincerely|respectfully|kindly)/gi, weight: 0.5 },
    { pattern: /(?:regarding|concerning|following\s+up)/gi, weight: 0.3 },
  ],
};

export class ContentValidators {
  /**
   * Check for PII in content
   */
  checkPII(content: string): PIICheck {
    const detections: PIICheck['locations'] = [];
    const types: Set<string> = new Set();

    for (const { type, pattern, mask } of PII_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        types.add(type);

        let index = 0;
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(content)) !== null) {
          detections.push({
            type,
            position: { start: match.index, end: match.index + match[0].length },
            masked: mask,
          });
        }
      }
    }

    return {
      detected: detections.length > 0,
      types: Array.from(types),
      count: detections.length,
      locations: detections,
    };
  }

  /**
   * Check regulatory compliance
   */
  checkRegulatory(content: string): { compliant: boolean; violations: RegulatoryCheck['violations'] } {
    const violations: RegulatoryCheck['violations'] = [];

    for (const rule of REGULATORY_PATTERNS) {
      const match = content.match(rule.pattern);
      if (match) {
        violations.push({
          regulation: rule.regulation,
          rule: rule.id,
          matchedText: match[0],
          severity: rule.severity,
        });
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Analyze tone
   */
  analyzeTone(content: string): ToneAnalysis {
    const scores = {
      aggression: 0,
      friendliness: 0,
      professionalism: 0,
    };

    // Calculate tone scores
    for (const [tone, patterns] of Object.entries(TONE_PATTERNS)) {
      for (const { pattern, weight } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          if (tone === 'aggressive') scores.aggression += matches.length * weight;
          if (tone === 'friendly') scores.friendliness += matches.length * weight;
          if (tone === 'professional') scores.professionalism += matches.length * weight;
        }
      }
    }

    // Determine overall tone
    let overall: ToneAnalysis['overall'] = 'neutral';
    if (scores.aggression > scores.friendliness && scores.aggression > scores.professionalism) {
      overall = 'aggressive';
    } else if (scores.friendliness > 0.5) {
      overall = 'friendly';
    } else if (scores.professionalism > 0.5) {
      overall = 'professional';
    }

    // Calculate confidence
    const total = scores.aggression + scores.friendliness + scores.professionalism;
    const confidence = total > 0 ? Math.min(1, total / 5) : 0.3;

    // Generate warnings
    const warnings: string[] = [];
    if (overall === 'aggressive') {
      warnings.push('Tone may be perceived as aggressive');
    }
    if (scores.friendliness === 0 && scores.professionalism === 0) {
      warnings.push('Tone lacks warmth or professionalism');
    }

    return {
      overall,
      confidence,
      characteristics: {
        formality: scores.professionalism,
        friendliness: scores.friendliness,
        assertiveness: scores.aggression,
        positivity: scores.friendliness / Math.max(1, scores.aggression + 0.1),
      },
      warnings,
    };
  }

  /**
   * Generate rewrite suggestions
   */
  generateSuggestions(
    content: string,
    issues: LLMIssue[]
  ): RewriteSuggestion[] {
    const suggestions: RewriteSuggestion[] = [];

    for (const issue of issues) {
      if (issue.type === 'regulatory' && issue.position) {
        const matchedText = content.substring(issue.position.start, issue.position.end);

        // Generate replacement based on issue
        let replacement = matchedText;
        const lower = matchedText.toLowerCase();

        if (lower.includes('guaranteed')) {
          replacement = matchedText.replace(/guaranteed/gi, 'potential');
        } else if (lower.includes('risk-free') || lower.includes('risk free')) {
          replacement = matchedText.replace(/risk[\s-]?free/gi, 'low-risk');
        } else if (lower.includes('100%')) {
          replacement = matchedText.replace(/100%/gi, 'up to 100%');
        } else {
          replacement = `[REVIEW: ${issue.category}]`;
        }

        suggestions.push({
          original: matchedText,
          replacement,
          reason: issue.suggestion || issue.description,
          position: issue.position,
          improvement: 'compliance',
        });
      }
    }

    return suggestions;
  }

  /**
   * Check for safety issues
   */
  checkSafety(content: string): LLMIssue[] {
    const issues: LLMIssue[] = [];

    // Dangerous instructions
    const dangerPatterns = [
      { pattern: /(?:how\s+to\s+)?(?:hack|exploit|break\s+in)/gi, category: 'Malicious Instructions' },
      { pattern: /(?:create|bypass)\s+(?:virus|malware|ransomware)/gi, category: 'Malware Related' },
      { pattern: /(?:instructions?\s+for)\s+(?:violence|harm|weapons?)/gi, category: 'Harmful Content' },
    ];

    for (const { pattern, category } of dangerPatterns) {
      if (pattern.test(content)) {
        issues.push({
          id: `safety-${Date.now()}`,
          type: 'safety',
          severity: 'critical',
          category,
          description: `Content contains potentially harmful instructions`,
          suggestion: 'Remove or rephrase harmful content',
          autoFixable: false,
        });
      }
    }

    return issues;
  }
}

// Singleton
export const validators = new ContentValidators();
