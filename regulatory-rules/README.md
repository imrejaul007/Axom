# TrustOS Regulatory Rules

Comprehensive regulatory rule definitions for compliance checking across SEC, FINRA, RBI, and Company Policy frameworks.

## Overview

This module contains machine-readable compliance rules that can be imported into the TrustOS Compliance SDK or used directly by compliance services.

## Structure

```
regulatory-rules/
├── README.md
├── package.json
├── src/
│   ├── index.ts                 # Main export
│   ├── sec/                     # SEC regulations
│   │   ├── index.ts
│   │   ├── rule17a4.ts         # Books & records
│   │   ├── rule10b5.ts         # Insider trading
│   │   ├── rule207.ts          # Research analyst rules
│   │   └── fairDisclosure.ts    # Reg FD
│   ├── finra/                   # FINRA regulations
│   │   ├── index.ts
│   │   ├── rule3110.ts         # Supervision
│   │   ├── rule3120.ts         # supervisory system
│   │   ├── rule2210.ts         # Communications
│   │   └── rule4511.ts         # Records
│   ├── rbi/                     # RBI regulations
│   │   ├── index.ts
│   │   ├── masterDirection.ts  # NBFC guidelines
│   │   ├── kyc.ts              # KYC requirements
│   │   └── digitalLending.ts   # Digital lending
│   └── companyPolicy/          # Company-specific rules
│       ├── index.ts
│       ├── dataPrivacy.ts      # Data handling
│       ├── communications.ts   # Internal comms
│       └── conflicts.ts        # Conflict of interest
├── dist/                        # Compiled output
└── examples/                    # Usage examples
```

## Quick Start

```typescript
import { SECRules, FINRARules, RBIRules, CompanyPolicyRules } from '@trustos/regulatory-rules';

// Get all SEC rules
const secRules = SECRules.getAll();

// Get FINRA communication rules
const finraCommRules = FINRARules.communications.getAll();

// Validate content against rules
import { RuleEngine } from '@trustos/regulatory-rules/engine';
const engine = new RuleEngine();
const result = engine.validate(content, [...SECRules.insiderTrading, ...FINRARules.communications]);
```

## Regulations Included

### SEC (Securities and Exchange Commission)

| Rule | Description |
|------|-------------|
| Rule 10b-5 | Insider trading & market manipulation |
| Rule 17a-4 | Books and records retention |
| Rule 206(4)-7 | Investment adviser compliance |
| Reg FD | Fair disclosure |
| Rule 207 | Research analyst rules |

### FINRA (Financial Industry Regulatory Authority)

| Rule | Description |
|------|-------------|
| Rule 3110 | Supervision requirements |
| Rule 3120 | Supervisory system |
| Rule 2210 | Communications with public |
| Rule 4511 | Books and records |
| Rule 4370 | Business continuity |
| Rule 2090 | Know your customer |

### RBI (Reserve Bank of India)

| Regulation | Description |
|------------|-------------|
| Master Direction | NBFC compliance |
| KYC Guidelines | Customer identification |
| Digital Lending | Digital lending platforms |
| IT Framework | Cybersecurity |
| Outsourcing | Third-party risk |

### Company Policies

| Policy | Description |
|--------|-------------|
| Data Privacy | PII handling, GDPR |
| Communications | Internal/external comms |
| Conflicts | Conflict of interest |
| Information Barrier | Chinese wall rules |

## Usage with Compliance SDK

```typescript
import { ComplianceClient } from '@trustos/compliance-sdk';
import { SECRules, FINRARules } from '@trustos/regulatory-rules';

const client = new ComplianceClient({
  communicationCompliance: 'http://localhost:4180',
});

// Import rules into the service
for (const rule of [...SECRules.insiderTrading, ...FINRARules.communications]) {
  await client.communication.addRule(rule);
}

// Now validation uses these rules
const result = await client.communication.validateEmail(email);
```

## Customization

Rules can be customized by extending the base rule format:

```typescript
import { createCustomRule } from '@trustos/regulatory-rules';

const myRule = createCustomRule({
  id: 'MY-CUSTOM-001',
  name: 'Custom Compliance Rule',
  regulation: 'COMPANY_POLICY',
  patterns: ['pattern1', 'pattern2'],
  severity: 'high',
  action: 'block',
});

await client.communication.addRule(myRule);
```

## License

MIT
