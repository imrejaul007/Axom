/**
 * RBI (Reserve Bank of India) Rules
 * Comprehensive regulatory compliance rules for Indian financial services
 */

import { ComplianceRule, RuleSet, createCustomRule } from '../types.js';

/**
 * KYC (Know Your Customer) Requirements
 * RBI Master Direction on KYC
 */
export const kycRules: ComplianceRule[] = [
  createCustomRule({
    id: 'RBI-KYC-001',
    name: 'Incomplete Customer Identification',
    regulation: 'RBI',
    category: 'KYC',
    subcategory: 'Customer Identification',
    severity: 'critical',
    patterns: [
      'customer[^.!?]*(?:not\\s+)?(?:identified|verified|authenticated)',
      'identity[^.!?]*(?:not\\s+)?(?:verified|confirmed|established)',
      'missing[^.!?]*(?:KYC|identity\\s+)?(?:documents?|proof|verification)',
      'unverified[^.!?]*(?:customer|client|account|beneficiary)',
      'PAN[^.!?]*(?:not\\s+)?(?:obtained|verified|linked)',
      'Aadhaar[^.!?]*(?:not\\s+)?(?:collected|verified|linked)',
      'CKYC[^.!?]*(?:not\\s+)?(?:searched|consulted|updated)',
    ],
    action: 'block',
    description: 'Prevents transactions without proper KYC verification',
    references: [
      { title: 'RBI KYC Master Direction', url: 'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=11659' },
    ],
  }),

  createCustomRule({
    id: 'RBI-KYC-002',
    name: 'Beneficial Owner Not Identified',
    regulation: 'RBI',
    category: 'KYC',
    subcategory: 'Beneficial Owner',
    severity: 'critical',
    patterns: [
      'beneficial\\s+owner[^.!?]*(?:not\\s+)?(?:identified|determined|documented)',
      'UBO[^.!?]*(?:not\\s+)?(?:disclosed|documented|identified)',
      'significant\\s+beneficial\\s+owner[^.!?]*(?:not\\s+)?(?:identified|registered)',
      'ownership\\s+structure[^.!?]*(?:not\\s+)?(?:documented|verified|established)',
      'control[^.!?]*(?:structure|persons?)[^.!?]*(?:not\\s+)?(?:mapped|documented)',
    ],
    action: 'block',
    description: 'Ensures identification of beneficial owners as per RBI guidelines',
  }),

  createCustomRule({
    id: 'RBI-KYC-003',
    name: 'Risk Categorization Missing',
    regulation: 'RBI',
    category: 'KYC',
    subcategory: 'Risk Assessment',
    severity: 'high',
    patterns: [
      'customer[^.!?]*(?:not\\s+)?(?:risk\\s+)?(?:categorized|rated|assessed)',
      'risk\\s+profile[^.!?]*(?:not\\s+)?(?:assigned|created|established)',
      'risk\\s+grading[^.!?]*(?:not\\s+)?(?:done|completed|performed)',
      'low\\s+risk[^.!?]*(?:without\\s+)?(?:documentation|verification)',
      'high\\s+risk[^.!?]*(?:without\\s+)?(?:enhanced\\s+)?(?:diligence|monitoring)',
    ],
    action: 'warn',
    description: 'Ensures proper risk categorization of customers',
  }),

  createCustomRule({
    id: 'RBI-KYC-004',
    name: 'Periodic Review Not Conducted',
    regulation: 'RBI',
    category: 'KYC',
    subcategory: 'Periodic Review',
    severity: 'medium',
    patterns: [
      'KYC[^.!?]*(?:periodic\\s+)?(?:review|update|renovation)[^.!?]*(?:overdue|pending|not\\s+done)',
      'periodic[^.!?]*(?:refresh|update|review)[^.!?]*(?:not\\s+)?(?:conducted|completed)',
      'customer[^.!?]*(?:data\\s+)?(?:not\\s+)?(?:updated|refreshed|verified)',
      'review\\s+cycle[^.!?]*(?:not\\s+)?(?:met|satisfied|completed)',
    ],
    action: 'warn',
    description: 'Ensures periodic KYC reviews are conducted',
  }),
];

/**
 * AML/CFT (Anti Money Laundering / Combating Financing of Terrorism) Rules
 */
export const amlCftRules: ComplianceRule[] = [
  createCustomRule({
    id: 'RBI-AML-001',
    name: 'Suspicious Transaction Not Reported',
    regulation: 'RBI',
    category: 'AML/CFT',
    subcategory: 'STR',
    severity: 'critical',
    patterns: [
      'suspicious[^.!?]*(?:transaction|report|activity)[^.!?]*(?:not\\s+)?(?:filed|reported|disclosed)',
      'STR[^.!?]*(?:not\\s+)?(?:filed|reported|submitted)',
      'CTIL[^.!?]*(?:not\\s+)?(?:filed|reported)',
      'alert[^.!?]*(?:not\\s+)?(?:investigated|escalated|reviewed)',
      'flagged[^.!?]*(?:transaction|activity|account)[^.!?]*(?:not\\s+)?(?:reviewed|investigated)',
    ],
    action: 'block',
    description: 'Ensures suspicious transactions are reported to FIU-IND',
    references: [
      { title: 'PML Act 2002', url: 'https://fiuindia.gov.in/' },
    ],
  }),

  createCustomRule({
    id: 'RBI-AML-002',
    name: 'Cash Transaction Threshold Violation',
    regulation: 'RBI',
    category: 'AML/CFT',
    subcategory: 'Cash Transactions',
    severity: 'high',
    patterns: [
      'cash[^.!?]*(?:transaction|deposit|withdrawal)[^.!?]*(?:above|exceeding|more\\s+than)\\s+Rs?\\.?\\s*10\\s*lakh',
      'series[^.!?]*(?:of\\s+)?(?:cash\\s+)?transactions?[^.!?]*(?:structuring|segmenting|splitting)',
      'structuring[^.!?]*(?:transactions?|deposits?|withdrawals?)',
      'layering[^.!?]*(?:of\\s+)?(?:funds?|transactions?)',
      'smurf(?:ing|ed)?(?:\\s+(?:transactions?|deposits?))?',
      'split(?:ting|s)?(?:\\s+(?:transactions?|deposits?|amounts?))?',
    ],
    action: 'block',
    description: 'Prevents cash transaction structuring and CTR violations',
  }),

  createCustomRule({
    id: 'RBI-AML-003',
    name: 'High-Risk Customer Not Monitored',
    regulation: 'RBI',
    category: 'AML/CFT',
    subcategory: 'Enhanced Due Diligence',
    severity: 'critical',
    patterns: [
      'high\\s+risk[^.!?]*(?:customer|client|account)[^.!?]*(?:without\\s+)?(?:EDD|enhanced)',
      'politically\\s+exposed[^.!?]*(?:person|PEPs?)[^.!?]*(?:not\\s+)?(?:identified|monitored)',
      'PEP[^.!?]*(?:not\\s+)?(?:identified|disclosed|escalated)',
      'enhanced\\s+due\\s+diligence[^.!?]*(?:not\\s+)?(?:conducted|performed|applied)',
      'senior\\s+foreign\\s+official[^.!?]*(?:not\\s+)?(?:identified|documented)',
    ],
    action: 'block',
    description: 'Ensures enhanced monitoring of high-risk customers and PEPs',
  }),
];

/**
 * Digital Lending Guidelines
 */
export const digitalLendingRules: ComplianceRule[] = [
  createCustomRule({
    id: 'RBI-DL-001',
    name: 'Unauthorized Lending Activity',
    regulation: 'RBI',
    category: 'Digital Lending',
    subcategory: 'Authorization',
    severity: 'critical',
    patterns: [
      'digital\\s+lending[^.!?]*(?:without\\s+)?(?:RBI\\s+)?(?:approval|authorization|registration)',
      'lending\\s+platform[^.!?]*(?:not\\s+)?(?:registered|authorized|approved)',
      'NBFC[^.!?]*(?:without\\s+)?(?:registration|authorization)',
      'loan[^.!?]*(?:disbursement|origination)[^.!?]*(?:not\\s+)?(?:permitted|authorized)',
      'co-lending[^.!?]*(?:without\\s+)?(?:agreement|approval)',
    ],
    action: 'block',
    description: 'Prevents unauthorized digital lending activities',
    references: [
      { title: 'RBI Digital Lending Guidelines', url: 'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=12233' },
    ],
  }),

  createCustomRule({
    id: 'RBI-DL-002',
    name: 'Excessive Interest Rate',
    regulation: 'RBI',
    category: 'Digital Lending',
    subcategory: 'Interest Rates',
    severity: 'critical',
    patterns: [
      'interest\\s+rate[^.!?]*(?:above|exceeding|more\\s+than)\\s+(?:3|three)\\s+times',
      'annual\\s+percentage\\s+rate[^.!?]*(?:above|exceeding)\\s+?[0-9]+%',
      'APR[^.!?]*(?:above|exceeding)\\s+?[0-9]+%',
      'lending\\s+rate[^.!?]*(?:not\\s+)?(?:in\\s+)?(?:accordance\\s+with\\s+)?(?:guidelines|rules)',
      'penal\\s+interest[^.!?]*(?:above|exceeding)\\s+(?:2|two)\\s+times',
    ],
    action: 'block',
    description: 'Ensures interest rates comply with RBI guidelines',
  }),

  createCustomRule({
    id: 'RBI-DL-003',
    name: 'Data Privacy Violation in Lending',
    regulation: 'RBI',
    category: 'Digital Lending',
    subcategory: 'Data Privacy',
    severity: 'high',
    patterns: [
      'borrower[^.!?]*(?:data\\s+)?(?:consent[^.!?]*(?:not\\s+)?(?:obtained|recorded|documented))',
      'personal\\s+data[^.!?]*(?:shared|disclosed|transferred)[^.!?]*(?:without\\s+)?(?:consent|approval)',
      'KYC\\s+data[^.!?]*(?:used|shared|transferred)[^.!?]*(?:for\\s+)?(?:other\\s+)?(?:purposes?|uses?)',
      'credit\\s+assessment[^.!?]*(?:data\\s+)?(?:not\\s+)?(?:secured|encrypted|protected)',
      'data\\s+breach[^.!?]*(?:not\\s+)?(?:reported|disclosed)',
    ],
    action: 'block',
    description: 'Ensures data privacy compliance in digital lending',
  }),
];

/**
 * IT Framework and Cyber Security
 */
export const itFrameworkRules: ComplianceRule[] = [
  createCustomRule({
    id: 'RBI-IT-001',
    name: 'Customer Data Not Protected',
    regulation: 'RBI',
    category: 'IT Framework',
    subcategory: 'Data Protection',
    severity: 'critical',
    patterns: [
      'customer[^.!?]*(?:data|information|details?)[^.!?]*(?:not\\s+)?(?:encrypted|secured|protected)',
      'sensitive\\s+data[^.!?]*(?:stored|transmitted)[^.!?]*(?:without\\s+)?(?:encryption|protection)',
      'data\\s+leak[^.!?]*(?:not\\s+)?(?:reported|disclosed|escalated)',
      'unauthorized\\s+access[^.!?]*(?:to\\s+)?(?:customer\\s+)?(?:data|systems?)',
      'breach[^.!?]*(?:notification|disclosure|reporting)[^.!?]*(?:not\\s+)?(?:done|completed)',
    ],
    action: 'block',
    description: 'Ensures customer data protection as per IT Framework',
    references: [
      { title: 'RBI IT Framework', url: 'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=11320' },
    ],
  }),

  createCustomRule({
    id: 'RBI-IT-002',
    name: 'Outsourcing Risk Not Managed',
    regulation: 'RBI',
    category: 'IT Framework',
    subcategory: 'Outsourcing',
    severity: 'high',
    patterns: [
      'outsourced[^.!?]*(?:IT\\s+)?(?:services?|processes?|operations?)[^.!?]*(?:without\\s+)?(?:agreement|approval)',
      'third\\s+party[^.!?]*(?:access|service|provider)[^.!?]*(?:not\\s+)?(?:assessed|reviewed|approved)',
      'outsourcing[^.!?]*(?:risk\\s+)?(?:assessment|due\\s+diligence)[^.!?]*(?:not\\s+)?(?:conducted|done)',
      'DPA[^.!?]*(?:not\\s+)?(?:signed|executed|established)',
      'data\\s+processor[^.!?]*(?:agreement|terms)[^.!?]*(?:not\\s+)?(?:in\\s+)?(?:place|effect)',
    ],
    action: 'warn',
    description: 'Ensures proper outsourcing risk management',
  }),
];

/**
 * NBFC Compliance
 */
export const nbfcRules: ComplianceRule[] = [
  createCustomRule({
    id: 'RBI-NBFC-001',
    name: 'Prudential Norms Violation',
    regulation: 'RBI',
    category: 'NBFC',
    subcategory: 'Prudential Norms',
    severity: 'critical',
    patterns: [
      'credit\\s+exposure[^.!?]*(?:to\\s+)?(?:single\\s+)?(?:borrower|entity)[^.!?]*(?:exceeding|above)\\s+15%',
      'group\\s+exposure[^.!?]*(?:exceeding|above)\\s+25%',
      'CRAR[^.!?]*(?:below|less\\s+than)\\s+15%',
      'capital\\s+adequacy[^.!?]*(?:below|less\\s+than)\\s+required',
      'NPA[^.!?]*(?:classification|recognition)[^.!?]*(?:not\\s+)?(?:done|followed|compliant)',
    ],
    action: 'block',
    description: 'Ensures compliance with NBFC prudential norms',
    references: [
      { title: 'NBFC Master Direction', url: 'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=11193' },
    ],
  }),

  createCustomRule({
    id: 'RBI-NBFC-002',
    name: 'Net Owned Fund Requirement',
    regulation: 'RBI',
    category: 'NBFC',
    subcategory: 'Capital Requirements',
    severity: 'critical',
    patterns: [
      'net\\s+owned\\s+fund[^.!?]*(?:below|less\\s+than)\\s+Rs?\\.?\\s*2\\s*crore',
      'owned\\s+fund[^.!?]*(?:not\\s+)?(?:maintained|available)',
      'capital\\s+base[^.!?]*(?:eroded|depleted|reduced)[^.!?]*(?:below\\s+)?(?:threshold|minimum)',
    ],
    action: 'block',
    description: 'Ensures minimum net owned fund requirements are met',
  }),
];

/**
 * Combined RBI Rule Set
 */
export const RBIRules: RuleSet = {
  name: 'RBI Regulations',
  regulation: 'RBI',
  description: 'Complete RBI regulatory compliance rules including KYC, AML, Digital Lending, and NBFC guidelines',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  rules: [
    ...kycRules,
    ...amlCftRules,
    ...digitalLendingRules,
    ...itFrameworkRules,
    ...nbfcRules,
  ],
};

// Helper to get rules by category
export function getRBIRulesByCategory(category: string): ComplianceRule[] {
  return RBIRules.rules.filter(rule => rule.category === category);
}

// Helper to get rules by subcategory
export function getRBIRulesBySubcategory(subcategory: string): ComplianceRule[] {
  return RBIRules.rules.filter(rule => rule.subcategory === subcategory);
}
