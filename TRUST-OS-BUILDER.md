# TrustOS Builder - Implementation Guide

## Overview

TrustOS is the Universal Trust & Safety Platform for the REZ ecosystem. It provides:
- Unified trust scoring across all products
- Real-time fraud detection
- Identity resolution and linking
- Scam detection (SMS, calls, links, WhatsApp)
- Breach detection and dark web monitoring
- Consumer-facing mobile app for scam protection

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TrustOS Shield App                          │
│                   (React Native / Expo Mobile)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  HomeScreen  │  │  ScanScreen  │  │  ScoreScreen │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ AlertsScreen │  │SettingsScreen │                                │
│  └──────────────┘  └──────────────┘                                │
├─────────────────────────────────────────────────────────────────────┤
│                         TrustOS Shield SDK                          │
│                    (@axom/trust-os-shield-sdk)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    TrustOS Unified Gateway                  │    │
│  │                         Port: 4166                          │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │    │
│  │  │ Fraud Check  │ │  Identity    │ │   Consent    │         │    │
│  │  │ Integration  │ │ Integration  │ │ Integration  │         │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘         │    │
│  │  ┌──────────────┐ ┌──────────────┐                          │    │
│  │  │Trust Scoring │ │ Scam Detect  │                          │    │
│  │  └──────────────┘ └──────────────┘                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         │                    │                    │                  │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌───────▼──────┐           │
│  │   Breach    │  │   Scam Call     │  │   REZ Core   │           │
│  │ Detection   │  │   Detection     │  │   Services   │           │
│  │ Port: 4170  │  │   Port: 4175    │  │              │           │
│  └─────────────┘  └─────────────────┘  └──────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Services

### 1. TrustOS Gateway (Port 4166)

**Purpose:** Unified API gateway for all trust services

**Location:** `Axom/trust-os-gateway/`

**Key Endpoints:**
```
GET  /api/v1/trust/score/:type/:id     - Get trust score
POST /api/v1/fraud/check               - Check fraud
POST /api/v1/identity/resolve          - Resolve identity
POST /api/v1/consent/grant             - Grant consent
POST /api/v1/scam/check               - Check scam
GET  /api/v1/health                   - Health check
```

**To Run:**
```bash
cd Axom/trust-os-gateway
npm install
npm run dev
```

### 2. Breach Detection Service (Port 4170)

**Purpose:** Dark web monitoring and data breach detection

**Location:** `Axom/breach-detection-service/`

**Features:**
- Check email/phone against HaveIBeenPwned API
- Monitor items for new breaches
- Track breach exposure severity
- Mock data for development without API key

**Key Endpoints:**
```
POST /check/email     - Check email breaches
POST /check/phone     - Check phone breaches
POST /monitor         - Add item to monitoring
GET  /monitor/:value  - Get monitoring status
GET  /stats           - Get breach statistics
GET  /health          - Health check
```

**To Run:**
```bash
cd Axom/breach-detection-service
npm install
npm run dev
```

**Environment Variables:**
```
PORT=4170
MONGODB_URI=mongodb://localhost:27017/breach_detection
HIBP_API_KEY=your-hibp-api-key  # Optional, uses mock data if not set
```

### 3. Scam Call Detection Service (Port 4175)

**Purpose:** Real-time call screening and scam identification

**Location:** `Axom/scam-call-detection/`

**Features:**
- Phone reputation scoring
- Community scam reporting
- Call screening integration
- Caller ID lookup

**Key Endpoints:**
```
POST /call/check       - Check phone reputation
POST /call/report      - Report scam call
GET  /call/search/:phone - Search phone
POST /call/caller-id   - Get caller ID info
GET  /stats            - Get spam statistics
GET  /health           - Health check
```

**To Run:**
```bash
cd Axom/scam-call-detection
npm install
npm run dev
```

### 4. TrustOS Shield SDK

**Purpose:** React Native SDK for consumer app integration

**Location:** `Axom/trust-os-shield-sdk/`

**Components:**
- `TrustShieldSDK` - Core protection UI
- `TrustScoreCard` - Animated score display
- `ScamAlertCard` - Alert display card
- `ScamBadge` - Status indicator badge

**To Use:**
```bash
cd Axom/trust-os-shield-sdk
npm install
```

### 5. TrustOS Shield App (React Native)

**Purpose:** Consumer-facing mobile app for scam protection

**Location:** `Axom/trust-os-shield-app/`

**Screens:**
- **Home** - Dashboard with protection status
- **Scan** - Check SMS, links, phone numbers
- **Score** - Trust score with breakdown
- **Alerts** - Breach alerts and warnings
- **Settings** - Protected items and preferences

**To Run:**
```bash
cd Axom/trust-os-shield-app
npm install
npx expo start
```

---

## API Reference

### Trust Score Response

```json
{
  "success": true,
  "data": {
    "overall": 720,
    "dimensions": {
      "identity": { "score": 850, "label": "Excellent" },
      "financial": { "score": 780, "label": "Good" },
      "behavioral": { "score": 720, "label": "Good" },
      "reputation": { "score": 650, "label": "Fair" },
      "compliance": { "score": 890, "label": "Excellent" }
    },
    "factors": [
      { "type": "positive", "factor": "Identity Verified", "impact": 15 },
      { "type": "positive", "factor": "Clean Record", "impact": 20 }
    ]
  },
  "meta": {
    "timestamp": "2026-06-02T00:00:00Z",
    "processingTimeMs": 45
  }
}
```

### Fraud Check Request/Response

**Request:**
```json
{
  "transactionId": "txn_123456",
  "userId": "user_789",
  "amount": 5000,
  "currency": "INR",
  "paymentMethod": "upi",
  "metadata": {
    "deviceId": "device_abc",
    "ip": "192.168.1.1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decision": "ALLOW",
    "riskScore": 15,
    "riskLevel": "low",
    "riskFactors": ["Verified device", "Known IP"],
    "processingTimeMs": 32
  }
}
```

### Scam Check Response

```json
{
  "success": true,
  "data": {
    "isScam": true,
    "riskLevel": "high",
    "riskScore": 85,
    "scamType": "bank_phishing",
    "reasons": [
      "Contains fake bank domain",
      "Requests OTP verification"
    ],
    "warnings": [
      "Urgency language detected",
      "Misspelled words found"
    ],
    "recommendations": ["Do not click the link", "Report this message"]
  }
}
```

---

## Trust Score Calculation

### Score Range: 0-1000

| Range | Label | Description |
|-------|-------|-------------|
| 800-1000 | Excellent | Highly trustworthy |
| 600-799 | Good | Generally trustworthy |
| 400-599 | Fair | Some risk factors |
| 200-399 | Poor | Significant risk |
| 0-199 | Critical | High fraud risk |

### Dimension Weights

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Identity | 25% | KYC status, verification level |
| Financial | 25% | Transaction history, payment behavior |
| Behavioral | 20% | Login patterns, device usage |
| Reputation | 15% | Reviews, reports, history |
| Compliance | 15% | Policy violations, fraud flags |

---

## Scam Detection Patterns

### High-Risk Keywords

**Urgency:**
- `immediately`, `urgent`, `act now`, `expires today`, `within 24 hours`

**Fear:**
- `account blocked`, `kyc expired`, `verify immediately`, `unauthorized access`

**Money:**
- `win`, `prize`, `lottery`, `reward`, `gift`, `cashback`, `₹`, `rs`

**Personal Info Requests:**
- `otp`, `one time password`, `cvv`, `password`, `pin`, `aadhaar`, `pan`

### Fake Bank Patterns
- `sbi-secure`, `hdfc-update`, `icici-verify`, `axisbank-login`

### Suspicious TLDs
- `.xyz`, `.top`, `.click`, `.link`, `.work`, `.loan`, `.online`

---

## Database Schemas

### MongoDB Collections

**breach_detection.breach_records**
```javascript
{
  email: String,           // indexed
  breaches: [{
    name: String,
    title: String,
    domain: String,
    breachDate: Date,
    dataClasses: [String],
    pwnCount: Number
  }],
  lastChecked: Date
}
```

**breach_detection.monitored_items**
```javascript
{
  type: String,            // 'email' | 'phone' | 'domain'
  value: String,           // indexed
  userId: String,
  isActive: Boolean,
  webhookUrl: String,
  createdAt: Date
}
```

**scam_calls.scam_reports**
```javascript
{
  phone: String,           // indexed
  callerType: String,      // 'scam' | 'spam' | 'telemarketing'
  reports: Number,
  verified: Boolean,
  communityReports: [{
    reporterId: String,
    reportedAt: Date,
    scamType: String
  }]
}
```

**scam_calls.phone_reputation**
```javascript
{
  phone: String,           // indexed, unique
  reputation: {
    score: Number,         // 0-100
    level: String         // 'trusted' | 'neutral' | 'suspicious' | 'dangerous'
  },
  stats: {
    totalCalls: Number,
    spamCalls: Number,
    scamCalls: Number,
    reports: Number
  }
}
```

---

## Environment Variables

### TrustOS Gateway (.env)
```env
PORT=4166
NODE_ENV=development
CORS_ORIGIN=*
FRAUD_SERVICE_URL=http://localhost:3001
FRAUD_AGENT_URL=http://localhost:3007
INTERNAL_SERVICE_TOKEN=trust-os-internal-token
```

### Breach Detection (.env)
```env
PORT=4170
MONGODB_URI=mongodb://localhost:27017/breach_detection
HIBP_API_KEY=your-api-key
```

### Scam Call Detection (.env)
```env
PORT=4175
MONGODB_URI=mongodb://localhost:27017/scam_calls
```

---

## Testing

### API Testing with curl

**Trust Score:**
```bash
curl -X GET http://localhost:4166/api/v1/trust/score/person/user123
```

**Fraud Check:**
```bash
curl -X POST http://localhost:4166/api/v1/fraud/check \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn_123","amount":5000,"currency":"INR"}'
```

**Scam Check:**
```bash
curl -X POST http://localhost:4166/api/v1/scam/check \
  -H "Content-Type: application/json" \
  -d '{"type":"sms","content":"Your SBI account will be blocked. Verify OTP immediately."}'
```

**Breach Check:**
```bash
curl -X POST http://localhost:4170/check/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Phone Reputation:**
```bash
curl -X POST http://localhost:4175/call/check \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

---

## Deployment Checklist

- [ ] MongoDB instance running
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Services started on correct ports
- [ ] Health endpoints responding
- [ ] Mobile app configured with correct API URLs
- [ ] Rate limiting tested
- [ ] Error handling verified

---

## Future Enhancements

1. **SMS Interception** - Native module for real-time SMS scanning
2. **Call Screening** - Native module for call blocking
3. **Biometric Auth** - Fingerprint/Face ID for app unlock
4. **Dark Web Real Integration** - Connect to more data brokers
5. **ML Models** - Train custom fraud detection models
6. **Real-time Webhooks** - Push notifications for breaches

---

## Support

For issues or questions:
- GitHub Issues: [REZ TrustOS Repository]
- Email: support@rez.trust

---

*Last Updated: June 2, 2026*
*Version: 1.0.0*
