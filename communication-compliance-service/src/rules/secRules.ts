/**
 * SEC Compliance Rules
 * Securities and Exchange Commission regulations
 */

import type { ComplianceRule } from './types.js';

// SEC Rule patterns
export const SEC_RULES: ComplianceRule[] = [
  // Promissory returns
  {
    id: 'sec-001',
    name: 'No Guaranteed Returns',
    description: 'SEC Rule: Cannot guarantee investment returns or promise specific performance',
    regulation: 'SEC',
    severity: 'critical',
    action: 'block',
    patterns: [
      'guaranteed return',
      'guaranteed profit',
      'assured returns',
      'assured profit',
      'will make you',
      'will return',
      'will earn',
      'definitely profit',
      'risk-free return',
      '100% profit',
      'double your money',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Undisclosed risk
  {
    id: 'sec-002',
    name: 'Undisclosed Risk',
    description: 'Must disclose investment risks',
    regulation: 'SEC',
    severity: 'high',
    action: 'block',
    patterns: [
      'no risk',
      'zero risk',
      'risk free',
      'safe investment',
      'guaranteed safe',
      'without risk',
      'minimal risk',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Testimonial restrictions
  {
    id: 'sec-003',
    name: 'No Testimonials',
    description: 'Cannot use testimonials claiming specific results',
    regulation: 'SEC',
    severity: 'high',
    action: 'block',
    patterns: [
      'i made',
      'i earned',
      'my returns were',
      'i doubled',
      'i tripled',
      'user testimonials',
      'customer success story',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Past performance
  {
    id: 'sec-004',
    name: 'Past Performance Disclaimer',
    description: 'Past performance must include disclaimer',
    regulation: 'SEC',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'historical return',
      'past performance',
      'previous returns',
      'last year',
      'annual return',
      'ytd return',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // False statements
  {
    id: 'sec-005',
    name: 'No False Statements',
    description: 'Cannot make false or misleading statements about investments',
    regulation: 'SEC',
    severity: 'critical',
    action: 'block',
    patterns: [
      'best investment',
      'only investment',
      'only fund',
      'no better option',
      'sure thing',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Unauthorized advice
  {
    id: 'sec-006',
    name: 'Investment Advice Disclaimer',
    description: 'Must include investment advice disclaimer',
    regulation: 'SEC',
    severity: 'low',
    action: 'warn',
    patterns: [
      'invest in',
      'you should buy',
      'recommend buying',
      'buy now',
      'sell now',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default SEC_RULES;
