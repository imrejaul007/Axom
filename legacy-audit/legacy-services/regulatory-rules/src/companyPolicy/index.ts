/**
 * Company Policy Rules
 * Internal company-specific compliance rules
 */

import { ComplianceRule, RuleSet, createCustomRule } from '../types';

/**
 * Data Privacy and Protection Rules
 * GDPR, HIPAA, and internal data handling policies
 */
export const dataPrivacyRules: ComplianceRule[] = [
  createCustomRule({
    id: 'COMPANY-DP-001',
    name: 'PII Unauthorized Disclosure',
    regulation: 'COMPANY_POLICY',
    category: 'Data Privacy',
    subcategory: 'PII',
    severity: 'critical',
    patterns: [
      'SSN[^.!?]*(?:\\d{3}[- ]?\\d{2}[- ]?\\d{4}|xxx-xx-xxxx)',
      'social\\s+security[^.!?]*(?:number|no\\.?)[^.!?]*(?:in\\s+)?(?:plain|clear|text|unredacted)',
      'credit\\s+card[^.!?]*(?:number|no\\.?|details?)[^.!?]*(?:in\\s+)?(?:plain|clear|text|unredacted)',
      'bank\\s+account[^.!?]*(?:number|no\\.?|details?)[^.!?]*(?:in\\s+)?(?:plain|clear|text|unredacted)',
      'password[^.!?]*(?:in\\s+)?(?:plain|clear|text|email|message|unencrypted)',
      'health(?:-|\\s)record[^.!?]*(?:shared|disclosed|emailed)[^.!?]*(?:without|without\\s+)',
      'medical(?:-|\\s)record[^.!?]*(?:shared|disclosed|emailed)[^.!?]*(?:without|without\\s+)',
      'diagnosis[^.!?]*(?:shared|disclosed)[^.!?]*(?:without|without\\s+)(?:patient\\s+)?consent',
      'driver'?s?\\s+licen(?:se|ses)\\s+(?:number|no\\.?)[^.!?]*(?:in\\s+)?(?:plain|clear|text|unredacted)',
      'passport[^.!?]*(?:number|no\\.?)[^.!?]*(?:in\\s+)?(?:plain|clear|text|unredacted)',
    ],
    action: 'block',
    description: 'Prevents unauthorized disclosure of personally identifiable information',
    references: [
      { title: 'GDPR Article 5', url: 'https://gdpr.eu/article-5-how-to-process-data/' },
      { title: 'HIPAA Privacy Rule', url: 'https://www.hhs.gov/hipaa/for-professionals/privacy/' },
    ],
  }),

  createCustomRule({
    id: 'COMPANY-DP-002',
    name: 'Unauthorized Data Transfer',
    regulation: 'COMPANY_POLICY',
    category: 'Data Privacy',
    subcategory: 'Data Transfer',
    severity: 'high',
    patterns: [
      'send[^.!?]*(?:confidential|proprietary|sensitive)\\s+(?:data|information|files?)\\s+externally',
      'upload[^.!?]*(?:customer\\s+)?(?:data|information)\\s+to\\s+(?:personal\\s+)?(?:cloud|drive|storage)',
      'share[^.!?]*(?:internal\\s+)?(?:data|information)\\s+(?:with|outside|externally|third\\s+party)',
      'transfer[^.!?]*(?:data|information|records?)\\s+(?:across|cross-)(?:border|bordered)',
      'recipient[^.!?]*(?:not\\s+)?(?:in\\s+)?(?:our\\s+)?(?:approved\\s+)?(?:list|vendor\\s+list)',
    ],
    action: 'block',
    description: 'Prevents unauthorized data transfers outside the organization',
  }),

  createCustomRule({
    id: 'COMPANY-DP-003',
    name: 'Data Retention Policy Violation',
    regulation: 'COMPANY_POLICY',
    category: 'Data Privacy',
    subcategory: 'Retention',
    severity: 'medium',
    patterns: [
      'retain[^.!?]*(?:data|records?|information)\\s+(?:longer\\s+than|over)\\s+(?:required|necessary|permitted)',
      'delete[^.!?]*(?:data|records?|information)\\s+(?:before|prior\\s+to)\\s+(?:required|mandatory|legal)',
      'archive[^.!?]*(?:data|records?|files?)\\s+(?:without|without\\s+)(?:proper|appropriate)\\s+(?:documentation|approval)',
      'dispose[^.!?]*(?:data|records?|information|hardware)\\s+(?:without|without\\s+)(?:secure\\s+)?(?:method|procedure|certification)',
    ],
    action: 'warn',
    description: 'Ensures compliance with data retention and disposal policies',
  }),
];

/**
 * Communications Policy Rules
 * Internal and external communication guidelines
 */
export const communicationsRules: ComplianceRule[] = [
  createCustomRule({
    id: 'COMPANY-COMM-001',
    name: 'Unauthorized External Communication',
    regulation: 'COMPANY_POLICY',
    category: 'Communications',
    subcategory: 'External',
    severity: 'high',
    patterns: [
      'external[^.!?]*(?:communication|email|message)[^.!?]*(?:not\\s+)?(?:approved|reviewed|authorized)',
      'contact[^.!?]*(?:customer|client|partner)\\s+(?:directly|personally)\\s+(?:without|without\\s+)(?:proper\\s+)?(?:channel|approval)',
      'respond[^.!?]*(?:to\\s+)?(?:media|press|journalist|reporter)\\s+(?:without|without\\s+)(?:PR|communications\\s+)?(?:approval|authorization)',
      'share[^.!?]*(?:company\\s+)?(?:information|news|updates?)\\s+(?:externally|publicly)\\s+(?:without|without\\s+)(?:approval|authorization)',
    ],
    action: 'block',
    description: 'Prevents unauthorized external communications',
  }),

  createCustomRule({
    id: 'COMPANY-COMM-002',
    name: 'Confidential Information in Email',
    regulation: 'COMPANY_POLICY',
    category: 'Communications',
    subcategory: 'Confidentiality',
    severity: 'high',
    patterns: [
      'confidential[^.!?]*(?:information|data|details?)[^.!?]*(?:in\\s+)?(?:email|message)',
      'proprietary[^.!?]*(?:information|trade\\s+secrets?|processes?)[^.!?]*(?:in\\s+)?(?:email|message)',
      'insider[^.!?]*(?:information|trading|data)[^.!?]*(?:in\\s+)?(?:email|message)',
      'earnings?[^.!?]*(?:results?|guidance|forecast)[^.!?]*(?:in\\s+)?(?:email|message)',
      'M&A[^.!?]*(?:discussions?|negotiations?|information)[^.!?]*(?:in\\s+)?(?:email|message)',
    ],
    action: 'warn',
    description: 'Warns about confidential information in communications',
  }),

  createCustomRule({
    id: 'COMPANY-COMM-003',
    name: 'Inappropriate Communication Channel',
    regulation: 'COMPANY_POLICY',
    category: 'Communications',
    subcategory: 'Channel',
    severity: 'medium',
    patterns: [
      'personal\\s+email[^.!?]*(?:for\\s+)?(?:business|company|work)\\s+(?:matters?|issues?|communications?)',
      'WhatsApp[^.!?]*(?:for\\s+)?(?:business|company|work)\\s+(?:matters?|issues?|communications?)',
      'personal\\s+messenger[^.!?]*(?:for\\s+)?(?:business|company|work)\\s+(?:matters?|issues?|communications?)',
      'unapproved[^.!?]*(?:communication|collaboration)\\s+(?:platform|tool|channel)',
      'Slack[^.!?]*(?:channel|direct)[^.!?]*(?:for\\s+)?(?:sensitive|confidential)\\s+(?:topics?|matters?)',
    ],
    action: 'warn',
    description: 'Warns about using inappropriate communication channels',
  }),
];

/**
 * Conflict of Interest Rules
 */
export const conflictOfInterestRules: ComplianceRule[] = [
  createCustomRule({
    id: 'COMPANY-COIPOL-001',
    name: 'Undisclosed Conflict of Interest',
    regulation: 'COMPANY_POLICY',
    category: 'Conflict of Interest',
    severity: 'high',
    patterns: [
      'conflict(?:-|\\s)of(?:-|\\s)interest[^.!?]*(?:not\\s+)?(?:disclosed|reported|declared)',
      'related(?:-|\\s)party[^.!?]*(?:transaction|dealing|relationship)[^.!?]*(?:not\\s+)?(?:disclosed|approved)',
      'self(?:-|\\s)deal(?:ing|ings?)[^.!?]*(?:not\\s+)?(?:disclosed|approved)',
      'personal[^.!?]*(?:benefit|gain|interest)[^.!?]*(?:from|related\\s+to)\\s+(?:business|company|transaction)',
      'family(?:-|\\s)member[^.!?]*(?:employed\\s+by|doing\\s+business\\s+with)\\s+(?:competitor|vendor|customer)',
      'outside(?:-|\\s)employment[^.!?]*(?:not\\s+)?(?:disclosed|approved)',
      'board(?:-|\\s)position[^.!?]*(?:with\\s+)?(?:competitor|conflicting\\s+entity)[^.!?]*(?:not\\s+)?(?:disclosed|approved)',
    ],
    action: 'block',
    description: 'Ensures proper disclosure of conflicts of interest',
  }),

  createCustomRule({
    id: 'COMPANY-COIPOL-002',
    name: 'Gift and Entertainment Policy Violation',
    regulation: 'COMPANY_POLICY',
    category: 'Conflict of Interest',
    subcategory: 'Gifts',
    severity: 'high',
    patterns: [
      'gift[^.!?]*(?:to|from)\\s+(?:client|vendor|partner|government\\s+official)[^.!?]*(?:exceeding|over|above)\\s+\\$?(?:100|one\\s+hundred)',
      'entertainment[^.!?]*(?:to|from)\\s+(?:client|vendor|partner)[^.!?]*(?:not\\s+)?(?:approved|documented)',
      'bribe[^.!?]*(?:or\\s+)?(?:kickback|inducement|gratuity)',
      'facilitation[^.!?]*(?:payment|benefit)[^.!?]*(?:to\\s+)?(?:government\\s+official|employee)',
    ],
    action: 'block',
    description: 'Prevents violations of gift and entertainment policies',
  }),
];

/**
 * Information Security Rules
 */
export const informationSecurityRules: ComplianceRule[] = [
  createCustomRule({
    id: 'COMPANY-IS-001',
    name: 'Credential Sharing',
    regulation: 'COMPANY_POLICY',
    category: 'Information Security',
    severity: 'critical',
    patterns: [
      'share[ds]?(?:\\s+(?:your\\s+)?)?(?:password|credentials?|login)\\s+(?:with\\s+)?(?:others?|team|members?|colleagues?)',
      'send[ds]?(?:\\s+(?:your\\s+)?)?(?:password|credentials?|login)\\s+(?:via\\s+)?(?:email|text|message)',
      'post[sd]?(?:\\s+(?:your\\s+)?)?(?:password|credentials?)',
      '共用[^.!?]*密码',
      'shared(?:-|\\s)account[^.!?]*(?:not\\s+)?(?:approved|documented)',
    ],
    action: 'block',
    description: 'Prevents sharing of credentials and passwords',
    references: [
      { title: 'CIS Controls v8', url: 'https://www.cisecurity.org/controls' },
    ],
  }),

  createCustomRule({
    id: 'COMPANY-IS-002',
    name: 'Unauthorized Software Installation',
    regulation: 'COMPANY_POLICY',
    category: 'Information Security',
    severity: 'high',
    patterns: [
      'download[^.!?]*(?:and\\s+)?install[^.!?]*(?:software|application|app)\\s+(?:without|without\\s+)(?:IT\\s+)?(?:approval|authorization)',
      'unapproved[^.!?]*(?:software|application|tool|app)[^.!?]*(?:on\\s+)?(?:company\\s+)?(?:device|computer|system)',
      'shadow(?:-|\\s)IT[^.!?]*(?:discovered|deployed|used)',
      'personal(?:-|\\s)software[^.!?]*(?:on\\s+)?(?:company\\s+)?(?:device|computer|system)',
    ],
    action: 'block',
    description: 'Prevents installation of unauthorized software',
  }),

  createCustomRule({
    id: 'COMPANY-IS-003',
    name: 'Phishing Indicators',
    regulation: 'COMPANY_POLICY',
    category: 'Information Security',
    severity: 'high',
    patterns: [
      'urgent[^.!?]*(?:action\\s+)?required[^.!?]*(?:immediately|within|by)\\s+(?:today|24\\s+hours?)',
      'verify[^.!?]*(?:your\\s+)?(?:account|identity|password|credentials)',
      'click[^.!?]*(?:here|on\\s+(?:the\\s+)?(?:link|bellow|bottom|attachment))',
      'suspend(?:ed|ing)?[^.!?]*(?:account|service|access)[^.!?]*(?:unless|immediately)',
      'confirm[^.!?]*(?:your\\s+)?(?:identity|account|details?)[^.!?]*(?:now|immediately|within)',
    ],
    action: 'warn',
    description: 'Detects potential phishing communication patterns',
  }),
];

/**
 * Social Media Policy Rules
 */
export const socialMediaRules: ComplianceRule[] = [
  createCustomRule({
    id: 'COMPANY-SM-001',
    name: 'Unauthorized Company Representation',
    regulation: 'COMPANY_POLICY',
    category: 'Social Media',
    severity: 'high',
    patterns: [
      '(?:I\\s+)?represent(?:ing|ed|)?\\s+(?:the\\s+)?company[^.!?]*(?:on|in)\\s+(?:my\\s+)?(?:personal\\s+)?(?:social\\s+)?(?:media|account|profile)',
      'speak(?:ing|)?\\s+for\\s+(?:the\\s+)?company[^.!?]*(?:on|in)\\s+(?:my\\s+)?(?:personal\\s+)?(?:social\\s+)?(?:media|account)',
      'as\\s+a(?:n)?\\s+(?:company\\s+)?(?:employee|rep|representative)[^.!?]*(?:on|in)\\s+(?:social\\s+)?(?:media|LinkedIn|Twitter|Facebook)',
      'official[^.!?]*(?:statement|comment|view|position)[^.!?]*(?:on|in)\\s+(?:my\\s+)?(?:personal\\s+)?(?:social\\s+)?(?:media|account)',
    ],
    action: 'block',
    description: 'Prevents unauthorized company representation on social media',
  }),

  createCustomRule({
    id: 'COMPANY-SM-002',
    name: 'Social Media Confidentiality',
    regulation: 'COMPANY_POLICY',
    category: 'Social Media',
    severity: 'high',
    patterns: [
      '(?:company\\s+)?(?:internal\\s+)?(?:proprietary|confidential|trade\\s+secret)[^.!?]*(?:on|in)\\s+(?:social\\s+)?(?:media|LinkedIn|Twitter|Facebook)',
      '(?:customer\\s+)?(?:client\\s+)?(?:data|information|details?)[^.!?]*(?:on|in)\\s+(?:social\\s+)?(?:media|LinkedIn)',
      '(?:unreleased\\s+)?(?:product|feature|service)[^.!?]*(?:on|in)\\s+(?:social\\s+)?(?:media|LinkedIn)',
      '(?:earnings?|financial\\s+)?(?:results?|guidance|forecast|performance)[^.!?]*(?:on|in)\\s+(?:social\\s+)?(?:media|LinkedIn)',
    ],
    action: 'block',
    description: 'Prevents sharing confidential information on social media',
  }),
];

/**
 * Combined Company Policy Rule Set
 */
export const CompanyPolicyRules: RuleSet = {
  name: 'Company Policies',
  regulation: 'COMPANY_POLICY',
  description: 'Internal company compliance rules for data privacy, communications, conflicts of interest, and information security',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  rules: [
    ...dataPrivacyRules,
    ...communicationsRules,
    ...conflictOfInterestRules,
    ...informationSecurityRules,
    ...socialMediaRules,
  ],
};

// Helper to get rules by category
export function getCompanyPolicyRulesByCategory(category: string): ComplianceRule[] {
  return CompanyPolicyRules.rules.filter(rule => rule.category === category);
}

// Helper to get all enabled rules
export function getEnabledRules(): ComplianceRule[] {
  return CompanyPolicyRules.rules.filter(rule => rule.enabled);
}
