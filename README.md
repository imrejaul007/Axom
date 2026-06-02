# Axom — Trust, Social & BPO Company

**Version:** 1.0  
**Date:** June 3, 2026

---

## OVERVIEW

**Axom** is a parent company focused on trust infrastructure, social platforms, and BPO services.

### Products of Axom

| Product | Description |
|---------|-------------|
| **BuzzLocal** | Hyperlocal social platform |
| **Z-Events** | Events platform |
| **rendez** | Rendezvous/dating platform |

### Trust & Intelligence Services

| Service | Description |
|---------|-------------|
| REZ-trust-os | Trust operating system |
| REZ-emotional-intelligence | Emotion AI |
| REZ-human-context-graph | Context graph |
| REZ-life-pattern-engine | Life patterns |
| REZ-memory-engine | Memory |
| REZ-cosmic-twin | Digital twin |

---

## BUZZLOCAL — Hyperlocal Social Platform

**Purpose:** Hyperlocal community engagement and social networking
**Tagline:** "Live Pulse of Your City" / "City Operating System"

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BuzzLocal App                           │
├─────────────────────────────────────────────────────────────┤
│  Community │ Safety │ Commerce │ Society │ Creator        │
└─────────────────────────────────────────────────────────────┘
```

### BuzzLocal Products (2)

| Product | Location | Description |
|---------|----------|-------------|
| **buzzlocal-app** | buzzlocal-app/ | React Native mobile app - City OS |
| **buzzlocal-services** | buzzlocal-services/ | 9 Backend microservices |

#### buzzlocal-app (Mobile App - City OS)
- **Tech:** React Native (Expo SDK 53), TypeScript, Expo Router
- **Screens:** 69 screens
- **Layers:** Home, Ask Buzz, Society, REZ Safe
- **Features:** AI-powered local Q&A, Safety infrastructure, Society OS

#### buzzlocal-services (Backend)
| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards, coin rewards |
| buzzlocal-vibe-service | 4003 | Vibe areas, check-ins, crowd heatmap |
| buzzlocal-community-service | 4004 | Communities, group posts |
| z-events-service | 4008 | Events, ticketing, QR check-in |
| buzzlocal-intelligence-service | 4010 | AI intelligence |
| buzzlocal-notification-service | 4011 | Push notifications |
| buzzlocal-realtime-service | 4012 | WebSocket real-time |
| buzzlocal-payment-service | 4013 | Payments |
| buzzlocal-weather-service | 4014 | Weather data |

### Legacy Services (from Axom)

| Service | Description |
|---------|-------------|
| buzzlocal-agency-service | Agency management |
| buzzlocal-intelligence-hub | Intelligence hub |
| buzzlocal-merchant-dashboard | Merchant tools |
| buzzlocal-movement-service | Movement tracking |
| buzzlocal-safety-service | Safety features |
| buzzlocal-society-service | Society management |
| buzzlocal-trust-service | Trust scores |

---

## Z-EVENTS — Events Platform

**Purpose:** Event discovery, booking, and management

### Z-Events Services

| Service | Description |
|---------|-------------|
| z-events-api | Event backend API |
| z-events-app | Event mobile app |
| z-events-web | Event web platform |

---

## TRUST OS

**REZ-trust-os** provides trust infrastructure across the REZ ecosystem.

### Trust Features

| Feature | Description |
|---------|-------------|
| Trust Scores | Multi-component trust scoring |
| Verification | Identity verification |
| Reputation | Reputation management |
| Fraud Detection | Fraud prevention |

---

## COMPLIANCE SERVICES SUITE

**ZeroDrift AI Compliance Firewall** - Feature-complete implementation for financial compliance.

### Compliance Microservices (Ports 4180-4185)

| Service | Port | Description |
|---------|------|-------------|
| [communication-compliance-service](communication-compliance-service/) | 4180 | Pre-send validation of emails, LinkedIn posts, documents |
| [policy-engine-service](policy-engine-service/) | 4181 | NLP-based policy document parsing and rule extraction |
| [enforcement-gateway](enforcement-gateway/) | 4182 | Real-time blocking, quarantine queue, advisory modes |
| [llm-compliance-service](llm-compliance-service/) | 4183 | AI-generated content validation, PII detection, tone analysis |
| [agent-governance-service](agent-governance-service/) | 4184 | AI agent permission control, boundaries, approval workflow |
| [audit-trail-service](audit-trail-service/) | 4185 | Complete compliance logging, reporting, export |

### Regulatory Coverage

| Framework | Rules |
|-----------|-------|
| **SEC** | Rule 10b-5 (insider trading), Rule 17a-4 (records), Reg FD, Rule 207 |
| **FINRA** | Rules 3110, 3120, 2210, 4511, 2090 (supervision, communications, KYC) |
| **RBI** | KYC, AML/CFT, Digital Lending, NBFC guidelines |
| **Company Policy** | Data Privacy (PII), Communications, Conflicts of Interest, InfoSec |

### SDK & Tools

| Package | Description |
|---------|-------------|
| [compliance-sdk](compliance-sdk/) | Unified TypeScript/JS SDK with React hooks and Express middleware |
| [regulatory-rules](regulatory-rules/) | Machine-readable compliance rule definitions |

### Quick Start

```bash
# Install SDK
npm install @trustos/compliance-sdk

# Run services
cd communication-compliance-service && npm start  # Port 4180
cd policy-engine-service && npm start              # Port 4181
cd enforcement-gateway && npm start                # Port 4182
cd llm-compliance-service && npm start            # Port 4183
cd agent-governance-service && npm start          # Port 4184
cd audit-trail-service && npm start               # Port 4185
```

### Example Usage

```typescript
import { ComplianceClient } from '@trustos/compliance-sdk';

const client = new ComplianceClient({
  communicationCompliance: 'http://localhost:4180',
  enforcementGateway: 'http://localhost:4182',
  auditTrail: 'http://localhost:4185',
});

// Pre-send validation
const result = await client.communication.validateEmail({
  to: 'client@example.com',
  subject: 'Q3 Financial Summary',
  body: 'Based on our analysis...',
});

if (!result.canSend) {
  console.log('Blocked:', result.violations);
}

// Audit log
await client.audit.log({
  eventType: 'MESSAGE_SENT',
  userId: 'user123',
  action: 'email_sent',
  outcome: result.canSend ? 'SUCCESS' : 'BLOCKED',
});
```

---

## BPO SERVICES

BPO services are sold via **RABTUL SaaS** (sub-division of RABTUL Technologies):

| Product | Description |
|---------|-------------|
| axomi-bpo | BPO services |
| axomi-help | Help platform |

---

**License:** Proprietary - Axom
