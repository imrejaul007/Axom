/**
 * LLM Compliance Types
 */

export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'custom';
export type ContentType = 'email' | 'chat' | 'document' | 'social' | 'code' | 'general';

export interface LLMValidationRequest {
  content: string;
  source: LLMProvider;
  model?: string;
  contentType: ContentType;
  context?: {
    userId?: string;
    conversationId?: string;
    previousMessages?: string[];
  };
  options?: {
    checkTone?: boolean;
    checkPII?: boolean;
    checkRegulatory?: boolean;
    rewriteSuggestions?: boolean;
  };
}

export interface LLMValidationResult {
  id: string;
  valid: boolean;
  issues: LLMIssue[];
  toneAnalysis?: ToneAnalysis;
  piiCheck?: PIICheck;
  regulatoryCheck?: RegulatoryCheck;
  rewriteSuggestions?: RewriteSuggestion[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  processingTimeMs: number;
}

export interface LLMIssue {
  id: string;
  type: 'regulatory' | 'pii' | 'tone' | 'safety' | 'privacy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  position?: { start: number; end: number };
  suggestion?: string;
  autoFixable: boolean;
}

export interface ToneAnalysis {
  overall: 'professional' | 'friendly' | 'aggressive' | 'neutral' | 'inappropriate';
  confidence: number;
  characteristics: {
    formality: number;
    friendliness: number;
    assertiveness: number;
    positivity: number;
  };
  warnings: string[];
}

export interface PIICheck {
  detected: boolean;
  types: string[];
  count: number;
  locations: Array<{
    type: string;
    position: { start: number; end: number };
    masked: string;
  }>;
}

export interface RegulatoryCheck {
  compliant: boolean;
  violations: Array<{
    regulation: string;
    rule: string;
    matchedText: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface RewriteSuggestion {
  original: string;
  replacement: string;
  reason: string;
  position: { start: number; end: number };
  improvement: 'safety' | 'compliance' | 'tone' | 'privacy';
}

// Pattern definitions
export interface CompliancePattern {
  id: string;
  name: string;
  patterns: RegExp[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'regulatory' | 'pii' | 'safety' | 'privacy';
  description: string;
  suggestion: string;
}
