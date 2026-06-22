/**
 * FINRA (Financial Industry Regulatory Authority) Rules
 * Comprehensive regulatory compliance rules for broker-dealer operations
 */

import { ComplianceRule, RuleSet, createCustomRule } from '../types';

/**
 * FINRA Rule 3110: Supervision
 * Requirements for supervisory obligations
 */
export const supervisionRules: ComplianceRule[] = [
  createCustomRule({
    id: 'FINRA-3110-001',
    name: 'Inadequate Supervision Indicators',
    regulation: 'FINRA',
    category: 'Supervision',
    subcategory: 'Oversight',
    severity: 'high',
    patterns: [
      'unsupervised[^.!?]*(?:trading|activity|account)',
      'proceed(?:s|ing)?[^.!?]*(?:without|skipping)\\s+(?:?:the\\s+)?(?:supervisor|supervision)',
      'exception[^.!?]*(?:to\\s+)?(?:supervisory\\s+)?(?:review|approval)',
      'waive[ds]?(?:\\s+(?:the\\s+)?)?(?:supervisory\\s+)?(?:requirement|review)',
      "don't\\s+(?:need\\s+)?(?:supervisor\\s+)?(?:approval|review)",
    ],
    action: 'block',
    description: 'Prevents bypass of supervisory requirements',
    references: [
      { title: 'FINRA Rule 3110', url: 'https://www.finra.org/rules-guidance/rulebooks/3100/3110' },
    ],
  }),

  createCustomRule({
    id: 'FINRA-3110-002',
    name: 'Unapproved Trading Activity',
    regulation: 'FINRA',
    category: 'Supervision',
    subcategory: 'Trading',
    severity: 'high',
    patterns: [
      'unapproved[^.!?]*(?:strategy|trading|position)',
      'unsuitable[^.!?]*(?:investment|trade|recommendation)',
      'churning[^.!?]*(?:account|activity|client)',
      'over[- ]?concentration[^.!?]*(?:portfolio|account|position)',
      'unsolicited[^.!?]*(?:trade|order|transaction)',
      'discretionar(?:y|ily)[^.!?]*(?:account|trading)',
    ],
    action: 'block',
    description: 'Prevents unapproved or unsuitable trading activity',
  }),

  createCustomRule({
    id: 'FINRA-3110-003',
    name: 'Customer Complaint Mishandling',
    regulation: 'FINRA',
    category: 'Supervision',
    subcategory: 'Complaints',
    severity: 'high',
    patterns: [
      'complaint[^.!?]*(?:do(?:es)?n\'t|not)\\s+(?:need\\s+)?(?:to\\s+)?(?:be\\s+)?(?:logged|recorded|documented)',
      'verbal[^.!?]*(?:complaint|issue)[^.!?]*(?:only|not\\s+formal)',
      'informal[^.!?]*(?:complaint|concern)[^.!?]*(?:no(?:t|\\s+)record)',
      'settle[^.!?]*(?:quietly|confidential(?:ly)?|without\\s+filing)',
      'do(?:es)?n\'t\\s+(?:need\\s+)?(?:to\\s+)?(?:report|disclose)',
    ],
    action: 'block',
    description: 'Prevents improper handling of customer complaints',
  }),
];

/**
 * FINRA Rule 3120: Supervisory System
 * Requirements for supervisory control procedures
 */
export const supervisorySystemRules: ComplianceRule[] = [
  createCustomRule({
    id: 'FINRA-3120-001',
    name: 'Testing and Training Bypass',
    regulation: 'FINRA',
    category: 'Supervisory System',
    subcategory: 'Testing',
    severity: 'medium',
    patterns: [
      'skip(?:ped|\\s+(?:the\\s+)?test(?:ing)?)?',
      'annual[^.!?]*(?:review|testing)[^.!?]*(?:waived|skipped|postponed)',
      'branch[^.!?]*(?:inspection|review|audit)[^.!?]*(?:delayed|postponed)',
      'test(?:ing|s)?[^.!?]*(?:requirement)[^.!?]*(?:not\\s+applicable)',
    ],
    action: 'warn',
    description: 'Prevents skipping required testing and training',
    references: [
      { title: 'FINRA Rule 3120', url: 'https://www.finra.org/rules-guidance/rulebooks/3100/3120' },
    ],
  }),

  createCustomRule({
    id: 'FINRA-3120-002',
    name: 'Report of Internal Inspection',
    regulation: 'FINRA',
    category: 'Supervisory System',
    subcategory: 'Reporting',
    severity: 'medium',
    patterns: [
      'internal[^.!?]*(?:inspection|review|audit)[^.!?]*(?:not\\s+(?:documented|recorded))',
      'deficien(?:cy|cies)[^.!?]*(?:not\\s+(?:documented|reported|addressed))',
      'findings?[^.!?]*(?:suppressed|withheld|hidden)',
    ],
    action: 'warn',
    description: 'Ensures proper documentation of internal inspections',
  }),
];

/**
 * FINRA Rule 2210: Communications with the Public
 * Requirements for correspondence and communications
 */
export const communicationRules: ComplianceRule[] = [
  createCustomRule({
    id: 'FINRA-2210-001',
    name: 'Unapproved Advertising',
    regulation: 'FINRA',
    category: 'Communications',
    subcategory: 'Advertising',
    severity: 'high',
    patterns: [
      'unapproved[^.!?]*(?:advertisement|marketing|brochure)',
      'pre[- ]?published[^.!?]*(?:content|material|article)',
      'social\\s+media[^.!?]*(?:post|message|tweet|update)[^.!?]*(?:not\\s+approved|without\\s+review)',
      'website[^.!?]*(?:update|change|content)[^.!?]*(?:not\\s+approved)',
      'email[^.!?]*(?:blast|campaign|mass)[^.!?]*(?:without\\s+approval)',
    ],
    action: 'block',
    description: 'Prevents use of unapproved advertising materials',
    references: [
      { title: 'FINRA Rule 2210', url: 'https://www.finra.org/rules-guidance/rulebooks/2200/2210' },
    ],
  }),

  createCustomRule({
    id: 'FINRA-2210-002',
    name: 'Misleading Performance Claims',
    regulation: 'FINRA',
    category: 'Communications',
    subcategory: 'Performance',
    severity: 'critical',
    patterns: [
      'guarantee[ds]?(?:\\s+(?:returns?|performance|results?))?',
      'risk[- ]?free[^.!?]*(?:investment|return|profit)',
      'no[- ]?risk[^.!?]*(?:investment|return)',
      'certain(?:\\s+(?:to|that))?[^.!?]*profit',
      'always[^.!?]*(?:makes?|earns?|wins?)',
      'past\\s+performance[^.!?]*(?:guarantee|ensure|imply)',
    ],
    action: 'block',
    description: 'Prevents misleading performance claims in communications',
  }),

  createCustomRule({
    id: 'FINRA-2210-003',
    name: 'Inadequate Disclosure',
    regulation: 'FINRA',
    category: 'Communications',
    subcategory: 'Disclosure',
    severity: 'high',
    patterns: [
      'investment[^.!?]*(?:objective|goal|purpose)[^.!?]*(?:not\\s+stated|missing)',
      'risk[^.!?]*(?:disclosure|disclaimer|warning)[^.!?]*(?:not\\s+included|missing)',
      'fees?[^.!?]*(?:disclosure|disclaimer)[^.!?]*(?:not\\s+prominent|buried)',
      'performance[^.!?]*(?:disclosure|disclaimer)[^.!?]*(?:not\\s+clear|missing)',
    ],
    action: 'warn',
    description: 'Ensures adequate risk and fee disclosures',
  }),

  createCustomRule({
    id: 'FINRA-2210-004',
    name: 'Testimonials and Endorsements',
    regulation: 'FINRA',
    category: 'Communications',
    subcategory: 'Testimonials',
    severity: 'high',
    patterns: [
      'testimonial[^.!?]*(?:not\\s+current|outdated)',
      'endorsement[^.!?]*(?:unapproved|not\\s+disclosed)',
      'referral[^.!?]*(?:fee|compensation)[^.!?]*(?:not\\s+disclosed)',
      'satisfied\\s+client[^.!?]*(?:testimonial)[^.!?]*(?:compensat(?:ed|ion))',
    ],
    action: 'warn',
    description: 'Ensures proper handling of testimonials and endorsements',
  }),
];

/**
 * FINRA Rule 4511: Books and Records
 * Requirements for recordkeeping
 */
export const booksAndRecordsRules: ComplianceRule[] = [
  createCustomRule({
    id: 'FINRA-4511-001',
    name: 'Incomplete Recordkeeping',
    regulation: 'FINRA',
    category: 'Books and Records',
    subcategory: 'Completeness',
    severity: 'high',
    patterns: [
      'incomplete[^.!?]*(?:record|documentation|file)',
      'missing[^.!?]*(?:signature|approval|authorization)',
      'not\\s+(?:properly\\s+)?(?:documented|recorded|filed)',
      'verbal[^.!?]*(?:agreement|understanding)[^.!?]*(?:only)',
      'side[^.!?]*(?:agreement|letter|arrangement)',
    ],
    action: 'block',
    description: 'Ensures complete and accurate recordkeeping',
    references: [
      { title: 'FINRA Rule 4511', url: 'https://www.finra.org/rules-guidance/rulebooks/4500/4511' },
    ],
  }),

  createCustomRule({
    id: 'FINRA-4511-002',
    name: 'Record Retention Period Violation',
    regulation: 'FINRA',
    category: 'Books and Records',
    subcategory: 'Retention',
    severity: 'medium',
    patterns: [
      'discard(?:ed|ing)?(?:\\s+(?:old|expired|outdated))?[^.!?]*(?:record|document|file)',
      'destroy(?:ed|ing)?(?:\\s+(?:old|expired))?[^.!?]*(?:record|document)',
      'retain(?:ing)?[^.!?]*(?:for\\s+)?(?:less\\s+than)?(?:required|specified)',
      'shorter\\s+than\\s+(?:required|specified)',
    ],
    action: 'warn',
    description: 'Prevents premature destruction of records',
  }),
];

/**
 * FINRA Rule 2090: Know Your Customer
 * Customer identification and suitability requirements
 */
export const kycRules: ComplianceRule[] = [
  createCustomRule({
    id: 'FINRA-2090-001',
    name: 'Inadequate Customer Identification',
    regulation: 'FINRA',
    category: 'Know Your Customer',
    subcategory: 'Identification',
    severity: 'high',
    patterns: [
      'unverified[^.!?]*(?:customer|client|account)',
      'identity[^.!?]*(?:not\\s+)?(?:verified|confirmed|checked)',
      'missing[^.!?]*(?:KYC|AML|identification)\\s+(?:information|data|documents?)',
      'incomplete[^.!?]*(?:account\\s+)?(?:opening|application|form)',
      'beneficial\\s+owner[^.!?]*(?:not\\s+)?(?:identified|disclosed|documented)',
    ],
    action: 'block',
    description: 'Prevents opening accounts without proper KYC',
    references: [
      { title: 'FINRA Rule 2090', url: 'https://www.finra.org/rules-guidance/rulebooks/2000/2090' },
    ],
  }),

  createCustomRule({
    id: 'FINRA-2090-002',
    name: 'Suitability Assessment Bypass',
    regulation: 'FINRA',
    category: 'Know Your Customer',
    subcategory: 'Suitability',
    severity: 'high',
    patterns: [
      'suitability[^.!?]*(?:not\\s+)?(?:assessed|evaluated|reviewed)',
      'risk\\s+tolerance[^.!?]*(?:not\\s+)?(?:documented|recorded|assessed)',
      'investment\\s+objective[^.!?]*(?:not\\s+)?(?:established|documented|agreed)',
      'customer[^.!?]*(?:profile|information)[^.!?]*(?:not\\s+)?(?:updated|reviewed)',
    ],
    action: 'block',
    description: 'Ensures proper suitability assessments are conducted',
  }),
];

/**
 * FINRA Rule 4370: Business Continuity
 * Requirements for business continuity planning
 */
export const businessContinuityRules: ComplianceRule[] = [
  createCustomRule({
    id: 'FINRA-4370-001',
    name: 'Business Continuity Plan Violation',
    regulation: 'FINRA',
    category: 'Business Continuity',
    severity: 'medium',
    patterns: [
      'BCP[^.!?]*(?:not\\s+)?(?:followed|implemented|activated)',
      'business\\s+continuit(?:y|ies)[^.!?]*(?:not\\s+)?(?:in\\s+)?(?:place|effect)',
      'disaster\\s+recovery[^.!?]*(?:not\\s+)?(?:tested|activated|available)',
      'contingenc(?:y|ies)[^.!?]*(?:not\\s+)?(?:in\\s+)?(?:place|effect)',
    ],
    action: 'warn',
    description: 'Ensures business continuity requirements are met',
    references: [
      { title: 'FINRA Rule 4370', url: 'https://www.finra.org/rules-guidance/rulebooks/4300/4370' },
    ],
  }),
];

/**
 * Combined FINRA Rule Set
 */
export const FINRARules: RuleSet = {
  name: 'FINRA Regulations',
  regulation: 'FINRA',
  description: 'Complete FINRA regulatory compliance rules including Rule 3110, 3120, 2210, and 4511',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  rules: [
    ...supervisionRules,
    ...supervisorySystemRules,
    ...communicationRules,
    ...booksAndRecordsRules,
    ...kycRules,
    ...businessContinuityRules,
  ],
};

// Helper to get rules by category
export function getFINRARulesByCategory(category: string): ComplianceRule[] {
  return FINRARules.rules.filter(rule => rule.category === category);
}

// Helper to get rules by subcategory
export function getFINRARulesBySubcategory(subcategory: string): ComplianceRule[] {
  return FINRARules.rules.filter(rule => rule.subcategory === subcategory);
}
