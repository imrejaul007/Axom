# REZ Cosmic Twin

Digital twin service that creates and manages digital representations of users and entities.

## What is a Digital Twin?

A **digital twin** is a dynamic, evolving software representation of a person, entity, or system.
It mirrors the real-world counterpart's characteristics, behaviors, and interactions — enabling
personalization, prediction, and intelligent automation at scale.

REZ Cosmic Twin gives each user a living digital twin that:

- **Learns** from interaction data and behavioral patterns
- **Syncs** across the REZ ecosystem via Memory Engine and Trust OS
- **Evolves** through capability-based growth (recommendation, prediction, simulation, etc.)
- **Serves** personalized experiences to every downstream REZ service

## Capabilities

| Capability | Description |
|------------|-------------|
| RECOMMENDATION | Suggests content, connections, and actions based on twin model |
| PREDICTION | Forecasts future behavior or preferences |
| PERSONALIZATION | Adapts experiences to the unique twin profile |
| ANALYSIS | Generates insights from accumulated data points |
| SIMULATION | Runs scenario modeling against the twin model |

## Architecture

```
Client --> REZ Gateway --> REZ Cosmic Twin
                              |
                              +--> Memory Engine (4054)
                              +--> Trust OS (4050)
```

- **Port**: 4055
- **Protocol**: REST/JSON
- **Storage**: In-memory (production: MongoDB + Redis)
- **Auth**: Internal service token (bearer)

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/twin/create | Create a new digital twin |
| GET | /api/twin/:id | Get twin by ID |
| GET | /api/twin/user/:userId | Get twin by user ID |
| PUT | /api/twin/:id | Update twin properties |
| POST | /api/twin/:id/sync | Sync data to twin |
| POST | /api/twin/:id/capability | Add a capability |
| GET | /api/twin/:id/sync | Get sync history |
| GET | /api/twin/status/:status | Get twins by status |
| GET | /api/twin/:id/learning | Get learning progress |
| DELETE | /api/twin/:id | Delete a twin |

## Development

```bash
npm run dev          # Start with hot-reload
npm run build        # Compile TypeScript
npm run test         # Run tests
npm run test:coverage # Run tests with coverage
```

## Docker

```bash
docker build -t rez-cosmic-twin .
docker run -p 4055:4055 rez-cosmic-twin
```

## License

MIT
