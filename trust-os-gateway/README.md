# TrustOS Unified Gateway

**Version:** 1.0.0
**Port:** 4166
**Category:** Trust & Safety

---

## Overview

TrustOS Unified Gateway provides a single API for all trust, fraud, and identity services across the REZ ecosystem. It integrates existing services into one unified layer.

## What It Integrates

| Service | Source | Features |
|---------|--------|----------|
| **Fraud Detection** | `rez-fraud-service` | Order/Payment fraud, velocity attacks |
| **Fraud Agent** | `rez-fraud-agent` | AI-powered fraud analysis, pattern matching |
| **Identity Resolution** | `REZ-unified-identity` | Cross-platform identity |
| **Consent/GDPR** | `rez-gdpr-service` | Consent management, data erasure |
| **Trust Scoring** | Local | Unified trust score calculation |
| **Scam Detection** | Local | SMS/Call/Link/WhatsApp analysis |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm run build && npm start
```

## API Endpoints

### Trust Score

```bash
# Get trust score for entity
GET /api/v1/trust/score/:entityType/:entityId

# Get unified trust score
POST /api/v1/trust/score/unified
```

### Fraud Check

```bash
# Check transaction for fraud
POST /api/v1/fraud/check

# Check if entity is blacklisted
GET /api/v1/fraud/blacklist/:type/:value
```

### Identity

```bash
# Resolve identity from identifier
POST /api/v1/identity/resolve

# Link two identities
POST /api/v1/identity/link
```

### Consent

```bash
# Grant consent
POST /api/v1/consent/grant

# Get all consents
GET /api/v1/consent/:userId
```

### Scam Detection

```bash
# Check content for scam
POST /api/v1/scam/check

# Quick SMS check
POST /api/v1/scam/check-sms

# Quick link check
POST /api/v1/scam/check-link

# WhatsApp check
POST /api/v1/scam/check-whatsapp
```

## Example Requests

### Check Fraud

```bash
curl -X POST http://localhost:4166/api/v1/fraud/check \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-123",
    "userId": "user-456",
    "amount": 5000,
    "currency": "INR",
    "ipAddress": "192.168.1.1"
  }'
```

### Check Scam SMS

```bash
curl -X POST http://localhost:4166/api/v1/scam/check-sms \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your bank account will be blocked. Click here to verify: sbi-secure.xyz",
    "sender": "+919876543210"
  }'
```

### Get Trust Score

```bash
curl http://localhost:4166/api/v1/trust/score/person/user-123
```

## Response Format

```json
{
  "success": true,
  "data": {
    "decision": "ALLOW",
    "riskScore": 25,
    "riskLevel": "low",
    "detectedPatterns": [],
    "riskFactors": []
  },
  "meta": {
    "timestamp": "2026-06-02T12:00:00.000Z",
    "requestId": "req-abc123",
    "processingTimeMs": 45
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4166 | Server port |
| `NODE_ENV` | development | Environment mode |
| `FRAUD_SERVICE_URL` | http://localhost:3001 | Fraud service URL |
| `FRAUD_AGENT_URL` | http://localhost:3007 | Fraud agent URL |
| `UNIFIED_IDENTITY_URL` | http://localhost:4060 | Identity service URL |
| `GDPR_SERVICE_URL` | http://localhost:3005 | GDPR service URL |
| `INTERNAL_SERVICE_TOKEN` | - | Token for downstream auth |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustOS Gateway (4166)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Routes                                                      │
│  ├── /api/v1/trust/score/*                                  │
│  ├── /api/v1/fraud/*                                        │
│  ├── /api/v1/identity/*                                     │
│  ├── /api/v1/consent/*                                     │
│  └── /api/v1/scam/*                                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Services                                                    │
│  ├── FraudIntegration      → rez-fraud-service/agent        │
│  ├── IdentityIntegration  → REZ-unified-identity           │
│  ├── ConsentIntegration    → rez-gdpr-service             │
│  ├── TrustScoring          → Local (unified score)          │
│  └── ScamDetection         → Local (pattern matching)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Status

- [x] Gateway core (Express)
- [x] Fraud integration (rez-fraud-service, rez-fraud-agent)
- [x] Identity integration (REZ-unified-identity)
- [x] Consent integration (rez-gdpr-service)
- [x] Trust scoring (unified)
- [x] Scam detection (SMS, call, link, WhatsApp)
- [ ] Health monitoring
- [ ] Metrics endpoint
- [ ] Rate limiting (advanced)
- [ ] Caching layer
