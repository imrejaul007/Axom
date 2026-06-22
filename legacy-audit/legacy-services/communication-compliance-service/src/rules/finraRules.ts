/**
 * FINRA Compliance Rules
 * Financial Industry Regulatory Authority regulations
 */

import type { ComplianceRule } from './types.js';

// FINRA Rule patterns
export const FINRA_RULES: ComplianceRule[] = [
  // Fair dealing
  {
    id: 'finra-001',
    name: 'Fair Dealing',
    description: 'Must treat customers fairly and honestly',
    regulation: 'FINRA',
    severity: 'high',
    action: 'block',
    patterns: [
      'we recommend',
      'our analysts believe',
      'buy rating',
      'sell rating',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Suitability
  {
    id: 'finra-002',
    name: 'Suitability',
    description: 'Must ensure investments are suitable for customer',
    regulation: 'FINRA',
    severity: 'high',
    action: 'block',
    patterns: [
      'perfect for you',
      'right for everyone',
      'suitable for all',
      'everyone should invest',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Disclosure
  {
    id: 'finra-003',
    name: 'Full Disclosure',
    description: 'Must disclose all material information',
    regulation: 'FINRA',
    severity: 'high',
    action: 'block',
    patterns: [
      'we don\'t need to tell you',
      'don\'t worry about',
      'don\'t concern yourself',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Fees disclosure
  {
    id: 'finra-004',
    name: 'Fee Disclosure',
    description: 'Must disclose all fees and charges',
    regulation: 'FINRA',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'no fees',
      'zero fee',
      'free account',
      'no charges',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Communication standards
  {
    id: 'finra-005',
    name: 'Communication Standards',
    description: 'Must meet FINRA communication standards',
    regulation: 'FINRA',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'unbelievable returns',
      'incredible gains',
      'amazing opportunity',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default FINRA_RULES;
