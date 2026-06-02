/**
 * Compliance Rules Index
 * Central export for all rule sets
 */

export { SEC_RULES, default as secRules } from './secRules.js';
export { FINRA_RULES, default as finraRules } from './finraRules.js';
export { CUSTOM_POLICY_RULES, default as customRules } from './customRules.js';
export { RBI_RULES, default as rbiRules } from './rbiRules.js';

import type { ComplianceRule } from './types.js';
import { SEC_RULES } from './secRules.js';
import { FINRA_RULES } from './finraRules.js';
import { CUSTOM_POLICY_RULES } from './customRules.js';
import { RBI_RULES } from './rbiRules.js';

// All rules combined
export const ALL_RULES: ComplianceRule[] = [
  ...SEC_RULES,
  ...FINRA_RULES,
  ...CUSTOM_POLICY_RULES,
  ...RBI_RULES,
];

// Rules by regulation
export const RULES_BY_REGULATION: Record<string, ComplianceRule[]> = {
  SEC: SEC_RULES,
  FINRA: FINRA_RULES,
  COMPANY_POLICY: CUSTOM_POLICY_RULES,
  RBI: RBI_RULES,
};
