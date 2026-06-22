# TrustOS Breach Detection Service

Dark web monitoring and data breach detection service.

## Features

- **Email Breach Checking** - Check if email appears in known data breaches
- **Phone Exposure Monitoring** - Track phone number exposure
- **Continuous Monitoring** - Add emails/phones to watch list
- **HaveIBeenPwned Integration** - Uses the official HIBP API
- **Severity Assessment** - Classifies breach exposure levels

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

### Check Email Breaches
```bash
POST /check/email
Content-Type: application/json

{ "email": "user@example.com" }
```

### Check Phone Breaches
```bash
POST /check/phone
Content-Type: application/json

{ "phone": "+919876543210" }
```

### Add to Monitoring
```bash
POST /monitor
Content-Type: application/json

{
  "type": "email",
  "value": "user@example.com",
  "userId": "user_123",
  "webhookUrl": "https://example.com/webhook"
}
```

### Get Monitoring Status
```bash
GET /monitor/user@example.com
```

### Get Statistics
```bash
GET /stats
```

### Health Check
```bash
GET /health
```

## Response Example

```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "breached": true,
    "breaches": [
      {
        "name": "LinkedIn",
        "title": "LinkedIn",
        "domain": "linkedin.com",
        "breachDate": "2021-06-22",
        "pwnCount": 700000000,
        "dataClasses": ["Email addresses", "Phone numbers", "Names"]
      }
    ],
    "pasteCount": 0,
    "severity": "high",
    "lastChecked": "2026-06-02T00:00:00Z"
  }
}
```

## Severity Levels

| Level | Description |
|-------|-------------|
| none | No breaches found |
| low | 1 breach with non-sensitive data |
| medium | 1-2 breaches |
| high | 3+ breaches or sensitive data exposed |
| critical | Passwords or financial data exposed |

## Environment Variables

```env
PORT=4170
MONGODB_URI=mongodb://localhost:27017/breach_detection
HIBP_API_KEY=your-hibp-api-key
```

**Note:** HIBP_API_KEY is optional. Without it, the service uses mock data for development.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **External API:** HaveIBeenPwned

## License

Internal - REZ Trust Network
