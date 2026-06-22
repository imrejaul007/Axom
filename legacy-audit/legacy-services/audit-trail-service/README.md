# TrustOS Audit Trail Service

Complete compliance logging and reporting.

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

### Log Events
```bash
POST /log
{
  "type": "compliance_check",
  "actor": { "id": "user1", "type": "user" },
  "action": "validate_email",
  "outcome": "success"
}
```

### Query Logs
```bash
GET /logs?startDate=2026-01-01&types=compliance_check&limit=50
```

### Reports
```bash
GET /reports/compliance?startDate=2026-01-01&endDate=2026-06-01
GET /reports/activity?groupBy=day
```

## Port

4185

## License

Internal - REZ Trust Network
