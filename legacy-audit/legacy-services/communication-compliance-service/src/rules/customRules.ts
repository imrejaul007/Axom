/**
 * Custom Company Policy Rules
 */

import type { ComplianceRule } from './types.js';

export const CUSTOM_POLICY_RULES: ComplianceRule[] = [
  // Internal policy patterns
  {
    id: 'policy-001',
    name: 'No Competitor References',
    description: 'Cannot mention competitors by name',
    regulation: 'COMPANY_POLICY',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'unlike competitor x',
      'better than y',
      'competitor comparison',
      'compared to z',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Professional tone
  {
    id: 'policy-002',
    name: 'Professional Tone',
    description: 'Must maintain professional tone in all communications',
    regulation: 'COMPANY_POLICY',
    severity: 'low',
    action: 'warn',
    patterns: [
      'omg',
      'lol',
      'wtf',
      'crap',
      'seriously?',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Confidential info
  {
    id: 'policy-003',
    name: 'No Confidential Info',
    description: 'Cannot share confidential company information',
    regulation: 'COMPANY_POLICY',
    severity: 'high',
    action: 'block',
    patterns: [
      'internal only',
      'confidential',
      'proprietary',
      'trade secret',
      'internal revenue',
      'project code name',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Legal claims
  {
    id: 'policy-004',
    name: 'No Legal Claims',
    description: 'Cannot make unauthorized legal claims',
    regulation: 'COMPANY_POLICY',
    severity: 'high',
    action: 'block',
    patterns: [
      'we guarantee',
      'legally obligated',
      'contractual right',
      'legal obligation',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Pricing
  {
    id: 'policy-005',
    name: 'Official Pricing Only',
    description: 'Can only share official pricing',
    regulation: 'COMPANY_POLICY',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'discounted price',
      'special rate',
      'exclusive deal',
      'limited time offer',
      'today only',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default CUSTOM_POLICY_RULES;
