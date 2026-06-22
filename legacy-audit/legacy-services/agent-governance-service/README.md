# TrustOS Agent Governance Service

Control AI agent actions with permission-based governance.

## Features

- **Permission Engine** - Check if agent can perform action
- **Boundary Enforcement** - Rate limits, time windows, data access
- **Approval Queue** - Human-in-the-loop for sensitive actions
- **Audit Logging** - Complete action trail
- **Agent Management** - Register, suspend, activate agents

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

### Register Agent

```bash
POST /agents
{
  "name": "Customer Support Bot",
  "type": "customer_support",
  "permissions": [
    { "action": "send_message", "decision": "allow" },
    { "action": "access_data", "resource": "customer_profile", "decision": "allow" }
  ],
  "boundaries": [
    { "type": "rate_limit", "config": { "limit": 100, "window": "1h" } }
  ]
}
```

### Check Permission

```bash
POST /check
{
  "agentId": "agent-uuid",
  "action": "send_email",
  "resource": "customer_data"
}
```

### Approval Queue

```bash
GET /approvals           # Get pending
POST /approvals/:id/approve  # Approve
POST /approvals/:id/reject   # Reject
```

## Port

4184

## License

Internal - REZ Trust Network
