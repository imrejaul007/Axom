# TrustOS Enforcement Gateway

Real-time pre-send validation and enforcement.

## Features

- **Real-time Validation** - < 100ms enforcement checks
- **Multiple Modes** - Blocking, Advisory, Audit
- **Quarantine Queue** - Hold content for review
- **Agent Governance** - Control AI agent actions
- **Configurable Rules** - Cached for speed

## Quick Start

```bash
npm install
npm run dev
```

## Modes

| Mode | Behavior |
|------|----------|
| blocking | Block critical violations, quarantine high |
| advisory | Warn only, no blocking |
| audit | Log only, no action |

## API Endpoints

### Pre-send Validation

```bash
POST /enforce/pre-send
{
  "content": "Your message content",
  "channel": "email",
  "sender": { "id": "user123", "type": "user" },
  "recipient": { "email": "client@example.com" }
}
```

### Agent Action Enforcement

```bash
POST /enforce/agent
{
  "content": "AI agent's message",
  "agentId": "agent_001",
  "action": "send_email"
}
```

### Quarantine Management

```bash
GET /quarantine          # Get pending items
POST /quarantine/:id/approve  # Approve
POST /quarantine/:id/reject   # Reject
POST /quarantine/:id/modify   # Modify & approve
```

## Port

4182

## License

Internal - REZ Trust Network
