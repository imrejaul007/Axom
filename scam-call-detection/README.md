# TrustOS Scam Call Detection Service

Real-time call screening and scam identification service.

## Features

- **Phone Reputation Scoring** - Score 0-100 based on reports
- **Community Reporting** - Users report scam/spam calls
- **Call Screening** - Determine if a call should be blocked
- **Caller ID Lookup** - Get caller information and tags
- **Multi-type Detection** - Scam, spam, telemarketing

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Check Phone Reputation
```bash
POST /call/check
Content-Type: application/json

{ "phone": "+919876543210" }
```

### Report Scam Call
```bash
POST /call/report
Content-Type: application/json

{
  "phone": "+919876543210",
  "callerType": "scam",
  "scamType": "bank_phishing",
  "description": "Claimed to be from SBI, asked for OTP"
}
```

### Search Phone
```bash
GET /call/search/+919876543210
```

### Get Caller ID Info
```bash
POST /call/caller-id
Content-Type: application/json

{ "phone": "+919876543210" }
```

### Get Statistics
```bash
GET /stats
```

### Health Check
```bash
GET /health
```

## Response Examples

### Phone Check Response
```json
{
  "success": true,
  "data": {
    "phone": "9876543210",
    "reputation": {
      "score": 25,
      "level": "dangerous",
      "isSpam": true,
      "isScam": true
    },
    "stats": {
      "reports": 15,
      "scamCalls": 8,
      "spamCalls": 12
    },
    "flags": ["High report count", "Multiple scam types"],
    "callerType": "scam",
    "scamType": "telecom_scam"
  }
}
```

### Caller ID Response
```json
{
  "success": true,
  "data": {
    "phone": "9876543210",
    "displayName": null,
    "verified": false,
    "tags": ["SCAM", "SPAM"],
    "riskLevel": "dangerous",
    "riskScore": 15,
    "communityRating": {
      "total": 15,
      "scam": 8,
      "spam": 12
    },
    "shouldBlock": true,
    "shouldWarn": true
  }
}
```

## Reputation Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| trusted | 80-100 | Verified legitimate caller |
| neutral | 50-79 | No reports |
| suspicious | 20-49 | Some reports |
| dangerous | 0-19 | Multiple scam reports |

## Scam Patterns Detected

- Bank impersonation (SBI, HDFC, ICICI, etc.)
- KYC/verification scams
- Prize/lottery scams
- Job/work from home scams
- Investment fraud
- Legal threat scams

## Environment Variables

```env
PORT=4175
MONGODB_URI=mongodb://localhost:27017/scam_calls
```

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose

## License

Internal - REZ Trust Network
