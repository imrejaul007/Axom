/**
 * SEC (Securities and Exchange Commission) Rules
 * Comprehensive regulatory compliance rules for US securities law
 */

import { ComplianceRule, RuleSet, createCustomRule } from '../types';

/**
 * SEC Rule 10b-5: Insider Trading Prevention
 * Prohibits trading on material non-public information
 */
export const insiderTradingRules: ComplianceRule[] = [
  createCustomRule({
    id: 'SEC-10b5-001',
    name: 'Material Non-Public Information (MNPI)',
    regulation: 'SEC',
    category: 'Insider Trading',
    subcategory: 'MNPI',
    severity: 'critical',
    patterns: [
      'earnings[^.!?]*[0-9]{1,2}/[0-9]{1,2}/[0-9]{2,4}',
      'revenue[^.!?]*(?:missed?|beat|exceeded?)',
      'profit[^.!?]*(?:increase|decrease|loss)',
      'quarterly results?[^.!?]*(?:before|prior to)',
      'merger(?: discussions?| negotiations?| talks?)',
      'acquisition(?: discussions?| negotiations?| plans?)',
      'takeover(?: discussions?| negotiations?| plans?| bid)?',
      'restructur(?:ing|e)',
      'bankruptcy[^.!?]*(?:filing|proceedings?|chapter)',
      'regulatory approval[^.!?]*(?:pending|awaiting|expected)',
      'FDA approval[^.!?]*(?:pending|awaiting)',
      'clinical trial[^.!?]*(?:results?|data)',
      'material contract[^.!?]*(?:signed|terminated|disputed)',
      'significant customer[^.!?]*(?:loss|gain)',
      'executive[^.!?]*(?:departure|appointment|termination)',
      'board[^.!?]*(?:decision|approval|meeting)',
      '\\b(?:M\\s*&\\s*A|mergers?\\s*(?:and|&)\\s*acquisitions?)\\b',
      'going private',
      'spin[- ]?off',
      'dividend[^.!?]*(?:change|increase|cut|elimination)',
      'stock split',
      'buyback[^.!?]*(?:announcement|plan|program)',
      'capital raise',
      'debt offering',
      'credit facility[^.!?]*(?:amendment|renewal|termination)',
    ],
    action: 'block',
    description: 'Detects potential MNPI that could constitute insider trading',
    examples: {
      nonCompliant: 'Based on what we discussed in the board meeting, you should buy more shares before the earnings announcement.',
      compliant: 'General market analysis suggests diversified portfolio allocation.',
    },
    references: [
      { title: 'SEC Rule 10b-5', url: 'https://www.sec.gov/rules/final/33-7881.htm', section: 'Rule 10b-5' },
    ],
    effectiveDate: '2024-01-01',
  }),

  createCustomRule({
    id: 'SEC-10b5-002',
    name: 'Tender Offer Indicators',
    regulation: 'SEC',
    category: 'Insider Trading',
    subcategory: 'Tender Offers',
    severity: 'critical',
    patterns: [
      'tender offer',
      'offer to purchase',
      'acquisition premium',
      'target company[^.!?]*(?:identified|selected|pursuing)',
      'proxy fight',
      'shareholder(?:s)?[^.!?]*(?:vote|approval|consent)',
      'control premium',
      'majority stake[^.!?]*(?:acquisition|purchase|acquiring)',
      'going concern[^.!?]*(?:acquisition|merger)',
    ],
    action: 'block',
    description: 'Prevents disclosure of information related to tender offers',
    references: [
      { title: 'Williams Act', url: 'https://www.sec.gov/rules/final/34-42004.htm' },
    ],
  }),

  createCustomRule({
    id: 'SEC-10b5-003',
    name: 'Trading Recommendations Based on Inside Information',
    regulation: 'SEC',
    category: 'Insider Trading',
    subcategory: 'Recommendations',
    severity: 'critical',
    patterns: [
      'buy\\s+(?:this\\s+)?stock\\s+before\\s+(?:the\\s+)?(?:announcement|earnings|release)',
      'sell\\s+(?:your\\s+)?shares?\\s+(?:after|following)\\s+(?:the\\s+)?(?:news|announcement)',
      'short\\s+position[^.!?]*(?:before|prior to|until)\\s+(?:the\\s+)?(?:announcement)',
      'based\\s+on\\s+(?:what|information)\\s+(?:I|we)\\s+(?:heard|learned|know)',
      'confidential[^.!?]*(?:information|data|update|report)',
      'need[- ]to[- ]know[^.!?]*(?:basis|only)',
      'internal[^.!?]*(?:only|memo|communication)',
    ],
    action: 'block',
    description: 'Prevents trading recommendations based on non-public information',
  }),

  createCustomRule({
    id: 'SEC-10b5-004',
    name: 'Classic Insider Trading Patterns',
    regulation: 'SEC',
    category: 'Insider Trading',
    subcategory: 'Tipper-Tippee',
    severity: 'critical',
    patterns: [
      "don't\\s+tell\\s+anyone\\s+else\\s+about\\s+this",
      "keep\\s+this\\s+between\\s+(?:us|you\\s+and\\s+I)",
      "this\\s+is\\s+(?:just\\s+for\\s+)?(?:you|internal)",
      "per\\s+our\\s+(?:earlier\\s+)?(?:discussion|conversation|talk)",
      "as\\s+we\\s+(?:discussed|mentioned|talked)",
      "following\\s+up\\s+on\\s+our\\s+(?:earlier\\s+)?(?:discussion|conversation)",
    ],
    action: 'block',
    description: 'Detects potential tipper-tippee insider trading communication patterns',
  }),
];

/**
 * SEC Rule 17a-4: Books and Records
 * Requirements for record retention
 */
export const booksAndRecordsRules: ComplianceRule[] = [
  createCustomRule({
    id: 'SEC-17a4-001',
    name: 'Record Retention Violation Indicators',
    regulation: 'SEC',
    category: 'Books and Records',
    subcategory: 'Retention',
    severity: 'high',
    patterns: [
      'delete\\s+(?:all\\s+)?(?:this\\s+)?(?:communication|email|message)',
      'destroy\\s+(?:all\\s+)?(?:this\\s+)?(?:document|record|file)',
      'remove\\s+from\\s+(?:the\\s+)?(?:record|system|database)',
      'purge\\s+(?:all\\s+)?(?:of\\s+)?(?:data|records?|files?)',
      'should\\s+(?:not|never)\\s+(?:be\\s+)?(?:recorded?|documented?|logged?)',
      'keep\\s+(?:this\\s+)?(?:off\\s+(?:the\\s+)?)?(?:record|the\\s+books?)',
      'unofficial[^.!?]*(?:channel|communication|record)',
      'side\\s+agreement[^.!?]*(?:not\\s+)?(?:in\\s+)?(?:writing|record)',
    ],
    action: 'block',
    description: 'Detects potential record destruction or falsification',
    references: [
      { title: 'SEC Rule 17a-4', url: 'https://www.sec.gov/rules/final/34-46095.htm' },
    ],
  }),

  createCustomRule({
    id: 'SEC-17a4-002',
    name: 'Falsification of Records',
    regulation: 'SEC',
    category: 'Books and Records',
    subcategory: 'Falsification',
    severity: 'critical',
    patterns: [
      'backdate[ds]?(?:\\s+(?:it|this|the))?',
      'retroactive(?:ly)?[^.!?]*(?:modify|change|update|edit)',
      'alter\\s+(?:the\\s+)?(?:record|document|date|entry)',
      'fabricat(?:e|ed|ing)[ds]?(?:\\s+(?:this|the))?',
      'falsif(?:y|ied|ying)[ds]?(?:\\s+(?:this|the))?',
      'make\\s+(?:something\\s+)?(?:up|fake)',
      'phantom[^.!?]*(?:transaction|trade|client)',
      'wash\\s+trade(?:s|ing)?',
      'mark[-\\s]?the[-\\s]?close',
    ],
    action: 'block',
    description: 'Prevents falsification of business records',
  }),
];

/**
 * SEC Rule 206(4)-7: Investment Adviser Compliance
 * Requires written policies and annual review
 */
export const investmentAdviserRules: ComplianceRule[] = [
  createCustomRule({
    id: 'SEC-206-001',
    name: 'Compliance Program Bypass',
    regulation: 'SEC',
    category: 'Investment Adviser',
    subcategory: 'Compliance',
    severity: 'high',
    patterns: [
      'skip\\s+(?:the\\s+)?compliance',
      'bypass\\s+(?:the\\s+)?(?:compliance|approval)',
      'proceed\\s+(?:without|skipping)\\s+(?:compliance|approval)',
      "don't\\s+(?:need\\s+)?(?:compliance\\s+)?(?:review|approval)",
      'waive\\s+(?:the\\s+)?(?:compliance\\s+)?(?:requirement|review)',
      'exception[^.!?]*(?:for\\s+)?(?:this\\s+)?(?:time|deal|client)',
      'one[- ]time[^.!?]*(?:exception|waiver|adjustment)',
    ],
    action: 'block',
    description: 'Prevents attempts to bypass compliance procedures',
    references: [
      { title: 'SEC Rule 206(4)-7', url: 'https://www.sec.gov/rules/final/ia-2204.htm' },
    ],
  }),

  createCustomRule({
    id: 'SEC-206-002',
    name: 'Fee Calculation Manipulation',
    regulation: 'SEC',
    category: 'Investment Adviser',
    subcategory: 'Fees',
    severity: 'critical',
    patterns: [
      'overstate[ds]?(?:\\s+(?:the\\s+)?)?(?:AUM|assets|values?)',
      'understate[ds]?(?:\\s+(?:the\\s+)?)?(?:liabilities?|losses?)',
      'incorrect(?:ly)?[^.!?]*(?:calculate|compute|report)',
      'adjust(?:ed|ing)?[^.!?]*(?:NAV|net\\s+asset)',
      'valuation[^.!?]*(?:methodology|approach|technique)',
      'fair\\s+value[^.!?]*(?:override|adjustment|discretion)',
    ],
    action: 'block',
    description: 'Prevents manipulation of fee calculations or asset valuations',
  }),
];

/**
 * Regulation FD: Fair Disclosure
 * Prohibits selective disclosure of material information
 */
export const fairDisclosureRules: ComplianceRule[] = [
  createCustomRule({
    id: 'SEC-RegFD-001',
    name: 'Selective Disclosure',
    regulation: 'SEC',
    category: 'Fair Disclosure',
    subcategory: 'Selective Disclosure',
    severity: 'critical',
    patterns: [
      'just\\s+(?:to|for)\\s+(?:you|your\\s+eyes\\s+only)',
      'off[- ]?the[- ]?record',
      'not\\s+(?:for\\s+)?(?:attribution|publication)',
      'on\\s+a\\s+(?:private|confidential)\\s+(?:basis|call|meeting)',
      'only\\s+(?:for\\s+)?(?:selected|chosen|institutional)\\s+(?:investors?|analysts?)',
      'ahead\\s+of\\s+(?:the\\s+)?(?:public|announcement)',
      'analyst[^.!?]*(?:call|meeting|update)[^.!?]*(?:only|specific|selected)',
      'institutional[^.!?]*(?:investor|client)[^.!?]*(?:only|exclusive)',
    ],
    action: 'block',
    description: 'Prevents selective disclosure of material non-public information',
    references: [
      { title: 'Regulation FD', url: 'https://www.sec.gov/rules/final/33-7881.htm' },
    ],
  }),

  createCustomRule({
    id: 'SEC-RegFD-002',
    name: 'Regulation FD Disclosure Timing',
    regulation: 'SEC',
    category: 'Fair Disclosure',
    subcategory: 'Timing',
    severity: 'high',
    patterns: [
      'disclose[^.!?]*(?:simultaneously|promptly|immediately)',
      'public(?:ly)?[^.!?]*(?:release|announcement|disclosure)',
      'press\\s+release[^.!?]*(?:required|needed|before)',
      'Form\\s*8[- ]?K[^.!?]*(?:filing|deadline)',
      'material[^.!?]*(?:information|data|events?)[^.!?]*(?:public|disclosure)',
    ],
    action: 'review',
    description: 'Ensures proper disclosure timing for material information',
  }),
];

/**
 * SEC Rule 207: Research Analyst Rules
 * Requirements for research reports and communications
 */
export const researchAnalystRules: ComplianceRule[] = [
  createCustomRule({
    id: 'SEC-207-001',
    name: 'Research Report Independence',
    regulation: 'SEC',
    category: 'Research Analyst',
    subcategory: 'Independence',
    severity: 'high',
    patterns: [
      'investment\\s+banking[^.!?]*(?:input|influence|review)',
      'coverage[^.!?]*(?:decision|initiated|terminated)[^.!?]*(?:based\\s+on|driven\\s+by)',
      'company[^.!?]*(?:pressure|request|influence)[^.!?]*(?:research|report)',
      'issu(?:e|ance|ing)[^.!?]*(?:based\\s+on|due\\s+to|following)',
      'rating[^.!?]*(?:changed|upgraded|downgraded)[^.!?]*(?:because|since|as)',
    ],
    action: 'warn',
    description: 'Prevents investment banking influence on research',
    references: [
      { title: 'SEC Rule 207', url: 'https://www.sec.gov/rules/final/34-45907.htm' },
    ],
  }),

  createCustomRule({
    id: 'SEC-207-002',
    name: 'Analyst Conflict Disclosure',
    regulation: 'SEC',
    category: 'Research Analyst',
    subcategory: 'Disclosure',
    severity: 'high',
    patterns: [
      'disclos(?:e|ed|ing)[^.!?]*(?:conflict|interest|position)',
      'proprietary[^.!?]*(?:position|holding|accounts?)',
      'market\\s+maker[^.!?]*(?:position|activity)',
      'investment\\s+banking[^.!?]*(?:relationship|fees|revenue)',
    ],
    action: 'review',
    description: 'Ensures proper disclosure of analyst conflicts of interest',
  }),
];

/**
 * Combined SEC Rule Set
 */
export const SECRules: RuleSet = {
  name: 'SEC Regulations',
  regulation: 'SEC',
  description: 'Complete SEC regulatory compliance rules including Rule 10b-5, Rule 17a-4, and Regulation FD',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  rules: [
    ...insiderTradingRules,
    ...booksAndRecordsRules,
    ...investmentAdviserRules,
    ...fairDisclosureRules,
    ...researchAnalystRules,
  ],
};

// Helper to get rules by category
export function getSECRulesByCategory(category: string): ComplianceRule[] {
  return SECRules.rules.filter(rule => rule.category === category);
}

// Helper to get rules by subcategory
export function getSECRulesBySubcategory(subcategory: string): ComplianceRule[] {
  return SECRules.rules.filter(rule => rule.subcategory === subcategory);
}
