# TrustOS LLM Compliance Service

Validate AI-generated content before it reaches customers.

## Features

- **Regulatory Check** - SEC, FINRA compliance validation
- **PII Detection** - Identify personal information
- **Tone Analysis** - Professional/friendly/aggressive detection
- **Safety Check** - Harmful content detection
- **Rewrite Suggestions** - Get compliant alternatives

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

### Full Validation

```bash
POST /validate
{
  "content": "Invest now for guaranteed 20% returns!",
  "source": "openai",
  "contentType": "email",
  "options": {
    "checkPII": true,
    "checkTone": true,
    "rewriteSuggestions": true
  }
}
```

### Quick Regulatory Check

```bash
POST /validate/quick
{
  "content": "Your message",
  "source": "claude"
}
```

### Full Scan

```bash
POST /validate/scan
{
  "content": "Full content to scan",
  "checkPII": true,
  "checkTone": true
}
```

### Get Rewrite Suggestions

```bash
POST /rewrite
{
  "content": "Content with issues"
}
```

## Port

4183

## License

Internal - REZ Trust Network
