# REZ Life Pattern Engine

A microservice that analyzes user behavior patterns and predicts future actions. Part of the REZ ecosystem, it integrates with other services like Trust OS and Memory Engine to provide comprehensive behavior analysis.

## Features

- **Behavior Event Recording**: Track user actions with context, location, and metadata
- **Pattern Detection**: Automatically detect recurring patterns from behavior data
- **Predictive Analysis**: Generate predictions based on identified patterns
- **Accuracy Tracking**: Monitor prediction accuracy over time
- **Behavior Summaries**: Get aggregated insights about user behavior

## Pattern Types

- `DAILY` - Patterns that occur every day (e.g., morning routine)
- `WEEKLY` - Weekly recurring patterns (e.g., Sunday shopping)
- `MONTHLY` - Monthly patterns (e.g., rent payment)
- `SEASONAL` - Seasonal patterns (e.g., summer activities)
- `CONTEXTUAL` - Patterns based on context (e.g., when raining)
- `BEHAVIORAL` - Complex behavioral patterns
- `SOCIAL` - Social interaction patterns

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pattern/event` | Record a behavior event |
| GET | `/api/pattern/detect/:userId` | Detect patterns for a user |
| GET | `/api/pattern/:userId` | Get all patterns for a user |
| GET | `/api/pattern/item/:id` | Get a specific pattern |
| PUT | `/api/pattern/:id` | Update a pattern |
| GET | `/api/pattern/predictions/:userId` | Get predictions for a user |
| POST | `/api/pattern/predict` | Make a new prediction |
| POST | `/api/pattern/outcome` | Record actual outcome |
| GET | `/api/pattern/accuracy/:userId` | Get prediction accuracy |
| GET | `/api/pattern/summary/:userId` | Get behavior summary |

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
PORT=4053
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-life-pattern
REDIS_HOST=localhost
REDIS_PORT=6379
INTERNAL_SERVICE_TOKEN=your-service-token
TRUST_OS_URL=http://localhost:4050
MEMORY_ENGINE_URL=http://localhost:4054
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Health Check

```bash
curl http://localhost:4053/health
```

## Architecture

The service uses in-memory storage for pattern data, making it suitable for development and small-scale deployments. For production, consider integrating with MongoDB for persistence.

## License

Proprietary - Axom Technologies
