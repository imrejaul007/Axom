# REZ Human Context Graph

A microservice that maps relationships and context between users, enabling rich social graph analysis and insights.

## Overview

The Human Context Graph service maintains a graph-based representation of user relationships, tracking:

- **Context Nodes**: Entities representing users with metadata and properties
- **Context Edges**: Relationships between nodes with strength, context, and interaction history
- **Graph Insights**: Derived insights about relationship patterns and user connections

## Features

- Add and manage context nodes for users
- Create and query relationships between users
- Track relationship strength (1-10 scale)
- Record interaction history and timestamps
- Generate insights about user connections
- Support for multiple relationship types (FAMILY, FRIEND, COLLEAGUE, etc.)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/graph/node` | Add a new context node |
| GET | `/api/graph/node/:id` | Get a specific node |
| GET | `/api/graph/nodes/:userId` | Get all nodes for a user |
| POST | `/api/graph/edge` | Create a relationship edge |
| GET | `/api/graph/edges/:nodeId` | Get edges for a node |
| GET | `/api/graph/relationship` | Get relationship between two users |
| GET | `/api/graph/:userId` | Get full graph for a user |
| GET | `/api/graph/connections/:userId` | Get user connections |
| GET | `/api/graph/insights/:userId` | Get graph insights |
| PUT | `/api/graph/interaction` | Update interaction timestamp |
| DELETE | `/api/graph/node/:id` | Remove a node |

## Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Run tests
npm test
```

## Environment Variables

See `.env.example` for required configuration.

## Health Check

```bash
curl http://localhost:4052/health
```

## Tech Stack

- Node.js with TypeScript
- Express.js for HTTP
- Zod for validation
- In-memory storage (production: connect to MongoDB)
