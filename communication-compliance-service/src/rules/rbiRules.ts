/**
 * RBI Compliance Rules
 * Reserve Bank of India regulations
 */

import type { ComplianceRule } from './types.js';

export const RBI_RULES: ComplianceRule[] = [
  // Digital banking
  {
    id: 'rbi-001',
    name: 'Banking Security Warning',
    description: 'Must include banking security warnings',
    regulation: 'RBI',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'bank account',
      'update kyc',
      'verify account',
      'link aadhaar',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // UPI regulations
  {
    id: 'rbi-002',
    name: 'UPI Security',
    description: 'UPI-related communications must follow RBI guidelines',
    regulation: 'RBI',
    severity: 'high',
    action: 'block',
    patterns: [
      'upi registration',
      'scan qr to receive',
      'transfer via upi',
      'npci',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Interest rates
  {
    id: 'rbi-003',
    name: 'Interest Rate Disclaimer',
    description: 'Must include interest rate terms and conditions',
    regulation: 'RBI',
    severity: 'medium',
    action: 'warn',
    patterns: [
      'interest rate',
      'rate of interest',
      'roi',
      'annual rate',
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default RBI_RULES;
