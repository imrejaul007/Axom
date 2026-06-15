# TrustOS Communication Compliance Service

Pre-send validation for all communications (email, LinkedIn, documents, chat).

## Features

- **Pre-send Validation** - Check content BEFORE sending
- **Multi-channel Support** - Email, LinkedIn, Document, Chat
- **Regulatory Rules** - SEC, FINRA, RBI, Company Policies
- **Rewrite Suggestions** - Get compliant alternatives
- **Risk Scoring** - Real-time risk assessment
- **Batch Processing** - Validate multiple items at once

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## API Endpoints

### Validate Content

```bash
POST /validate
Content-Type: application/json

{
  "content": "Invest now! Guaranteed 20% returns with zero risk!",
  "channel": "email",
  "contentType": "html",
  "sender": { "id": "user123", "name": "John Doe" },
  "recipient": { "email": "client@example.com" }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "passed": false,
    "violations": [
      {
        "id": "uuid",
        "ruleId": "sec-001",
        "ruleName": "No Guaranteed Returns",
        "regulation": "SEC",
        "severity": "critical",
        "matchedText": "Guaranteed 20% returns",
        "suggestion": "Remove guarantee language. Use 'may' or 'potentially' instead."
      }
    ],
    "riskScore": 65,
    "riskLevel": "high",
    "action": "review"
  }
}
```

### Quick Email Check

```bash
POST /validate/email
{
  "content": "Your email content here",
  "sender": { "email": "sender@example.com" },
  "recipient": { "email": "recipient@example.com" }
}
```

### Quick LinkedIn Check

```bash
POST /validate/linkedin
{
  "content": "LinkedIn post content"
}
```

### Batch Validation

```bash
POST /validate/batch
{
  "items": [
    { "content": "Content 1", "channel": "email" },
    { "content": "Content 2", "channel": "linkedin" }
  ]
}
```

## Rule Management

### List Rules

```bash
GET /rules
GET /rules?regulation=SEC
```

### Add Custom Rule

```bash
POST /rules
{
  "name": "No Profanity",
  "description": "Content must not contain profanity",
  "regulation": "COMPANY_POLICY",
  "severity": "medium",
  "action": "block",
  "patterns": ["badword1", "badword2"]
}
```

### Enable/Disable Rule

```bash
PATCH /rules/:id
{ "enabled": false }
```

## Supported Regulations

| Regulation | Description | Severity |
|------------|-------------|----------|
| SEC | Securities and Exchange Commission | Critical/High/Medium |
| FINRA | Financial Industry Regulatory Authority | High/Medium |
| RBI | Reserve Bank of India | High/Medium |
| COMPANY_POLICY | Custom company policies | High/Medium/Low |

## Violation Severity

| Severity | Action | Description |
|----------|--------|-------------|
| critical | block | Immediate block required |
| high | review | Manual review needed |
| medium | warn | Warning issued |
| low | warn | Minor issue |

## Environment Variables

```env
PORT=4180
NODE_ENV=development
```

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Rules:** Pattern matching + regex

## License

Internal - REZ Trust Network
