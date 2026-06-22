# REZ Trust OS

**Core trust infrastructure for the RTNM ecosystem**

## Overview

REZ Trust OS provides centralized trust management for all RTNM services:
- Multi-component trust scoring
- Identity verification
- Reputation management
- Fraud detection
- Trust score aggregation across services

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      REZ Trust OS                          │
├─────────────────────────────────────────────────────────────┤
│  Trust Score Engine  │  Identity Verification  │  Fraud    │
│                      │                       │  Detection │
├─────────────────────────────────────────────────────────────┤
│  Reputation Manager   │  Trust Aggregator     │  Audit    │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Trust Score Engine | 4050 | Calculate and manage trust scores |
| Identity Verification | 4051 | Verify user identities |
| Fraud Detection | 4052 | Detect fraudulent activities |
| Reputation Manager | 4053 | Manage user reputations |
| Trust Aggregator | 4054 | Aggregate trust across services |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## API Endpoints

### Trust Score

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trust/score/:userId` | Get user trust score |
| POST | `/api/trust/score` | Update trust score |
| GET | `/api/trust/history/:userId` | Get score history |

### Identity

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/identity/verify` | Verify user identity |
| GET | `/api/identity/:userId` | Get identity status |
| POST | `/api/identity/kyc` | Submit KYC data |

### Fraud

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fraud/check` | Check for fraud |
| GET | `/api/fraud/history/:userId` | Get fraud history |

## Environment Variables

See `.env.example` for all configuration options.

## License

Proprietary - Axom