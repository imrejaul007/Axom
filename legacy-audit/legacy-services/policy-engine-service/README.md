# TrustOS Policy Engine Service

Convert policies to machine-readable compliance rules.

## Features

- **Policy Parsing** - Extract rules from policy documents using NLP
- **Rule Generation** - Create machine-readable rules automatically
- **Rule Registry** - Manage and query compliance rules
- **Validation** - Check content against policies
- **Import/Export** - Manage rule sets

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

### Parse Policy Document

```bash
POST /policy/parse
{
  "name": "Investment Policy",
  "type": "compliance",
  "description": "Compliance policy for investment communications",
  "content": "Representatives must not guarantee returns. All investment claims require disclaimer.",
  "metadata": {
    "author": "Legal Team"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "policy": {
      "id": "uuid",
      "name": "Investment Policy",
      "rules": [...]
    },
    "statistics": {
      "totalRules": 2,
      "forbiddenRules": 1,
      "requiredRules": 1
    }
  }
}
```

### Validate Content

```bash
POST /validate
{
  "content": "Invest now for guaranteed 20% returns!",
  "policies": ["policy-id-1"]
}
```

### Rule Management

```bash
GET /rules
GET /rules/:id
PATCH /rules/:id
POST /rules/:id/enable
POST /rules/:id/disable
DELETE /rules/:id
```

## Policy Types

- `compliance` - Regulatory compliance
- `security` - Security policies
- `privacy` - Privacy policies
- `hr` - HR policies
- `operations` - Operational policies
- `finance` - Financial policies
- `legal` - Legal policies

## Rule Types

- `forbidden` - Prohibited actions
- `required` - Mandatory actions
- `conditional` - Conditional rules
- `disclaimer` - Required disclaimers

## Tech Stack

- Node.js + TypeScript
- Express.js
- Custom NLP parser

## License

Internal - REZ Trust Network
