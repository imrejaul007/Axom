# TrustOS Breach Detection Service

**Version:** 1.0.0
**Port:** 4170
**Category:** Dark Web Monitoring

---

## Overview

Monitors email, phone, and documents for data breaches. Alerts users when their data appears in known breaches.

## Features

- ✅ Email breach monitoring
- ✅ Phone breach monitoring
- ✅ Document monitoring (Aadhaar, PAN)
- ✅ Real-time breach alerts
- ✅ Background monitoring
- ✅ MongoDB storage

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/breach/check` | Check if data is breached |
| POST | `/breach/monitor` | Add to monitoring |
| GET | `/breach/monitor/:userId` | Get monitored items |
| GET | `/breach/alerts/:userId` | Get breach alerts |
| DELETE | `/breach/monitor/:userId/:type/:value` | Remove from monitoring |

## Quick Start

```bash
# Install dependencies
npm install

# Start service
npm run dev
```

## Example

```bash
# Check email breach
curl -X POST http://localhost:4170/breach/check \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## Response

```json
{
  "success": true,
  "data": {
    "breached": true,
    "breaches": [
      {
        "source": "LinkedIn 2021",
        "date": "2021-06-01",
        "dataTypes": ["email", "password", "phone"]
      }
    ],
    "riskLevel": "medium",
    "recommendations": [
      "Change your password immediately",
      "Enable two-factor authentication"
    ]
  }
}
```
