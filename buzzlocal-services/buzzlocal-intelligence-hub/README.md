# BuzzLocal Intelligence Hub

**Port:** 4026
**Purpose:** Central integration hub connecting BuzzLocal to REZ Intelligence services

---

## Connected Services

| REZ Intelligence Service | Port | BuzzLocal Usage |
|------------------------|------|-----------------|
| **Unified Profile** | 4120 | User profiles, trust scores |
| **Intent Predictor** | 4018 | Ask Buzz AI routing |
| **Predictive Engine** | 4123 | Churn, LTV, Revisit |
| **Realtime Segments** | 4126 | User segmentation |
| **Care Service** | 4055 | SOS, emergency |
| **Signal Aggregator** | 4121 | Event tracking |
| **Merchant Intel** | 4122 | Local recommendations |
| **Expert Services** | 3000-3011 | Domain answers |

---

## API Endpoints

### Profile
| Endpoint | Description |
|----------|-------------|
| `GET /api/profile/:userId` | Unified user profile |

### Intent/AI
| Endpoint | Description |
|----------|-------------|
| `POST /api/intent/classify` | Classify user intent |
| `POST /api/intent/respond` | Generate AI response |
| `POST /api/expert/query` | Query domain expert |

### Predictions
| Endpoint | Description |
|----------|-------------|
| `GET /api/predict/churn/:userId` | Churn risk score |
| `GET /api/predict/ltv/:userId` | Lifetime value |
| `GET /api/predict/revisit/:userId` | Revisit likelihood |

### Segments
| Endpoint | Description |
|----------|-------------|
| `GET /api/segments/:userId` | User segments |
| `POST /api/segments/evaluate` | Evaluate for segments |

### Safety/Care
| Endpoint | Description |
|----------|-------------|
| `POST /api/care/sos` | Trigger SOS |
| `GET /api/care/alerts/:area` | Area safety alerts |

### Signals
| Endpoint | Description |
|----------|-------------|
| `POST /api/signals/checkin` | Log check-in |
| `POST /api/signals/engagement` | Log engagement |

### Merchant
| Endpoint | Description |
|----------|-------------|
| `GET /api/merchant/recommendations/:area` | Area recommendations |
| `GET /api/merchant/profile/:id` | Merchant profile |

---

## Environment Variables

```bash
# REZ Intelligence
REZ_UNIFIED_PROFILE_URL=http://localhost:4120
REZ_INTENT_PREDICTOR_URL=http://localhost:4018
REZ_PREDICTIVE_ENGINE_URL=http://localhost:4123
REZ_REALTIME_SEGMENTS_URL=http://localhost:4126
REZ_CARE_SERVICE_URL=http://localhost:4055
REZ_SIGNAL_AGGREGATOR_URL=http://localhost:4121
REZ_MERCHANT_INTEL_URL=http://localhost:4122

# Expert Services
REZ_FITNESS_EXPERT_URL=http://localhost:3010
REZ_SALON_EXPERT_URL=http://localhost:3005
REZ_TRAVEL_EXPERT_URL=http://localhost:3003
REZ_HEALTH_EXPERT_URL=http://localhost:3011
REZ_HOSPITALITY_EXPERT_URL=http://localhost:3000
REZ_RETAIL_EXPERT_URL=http://localhost:3004
REZ_EDUCATION_EXPERT_URL=http://localhost:3006

# Internal
INTERNAL_SERVICE_TOKEN=your-token
```

---

## Usage Example

```typescript
// Get user profile with all intelligence
const profile = await fetch('http://localhost:4026/api/profile/user123');

// Classify intent
const intent = await fetch('http://localhost:4026/api/intent/classify', {
  method: 'POST',
  body: JSON.stringify({
    query: 'best gym nearby',
    context: { location: { lat: 12.9, lng: 77.6 } }
  })
});

// Query domain expert
const answer = await fetch('http://localhost:4026/api/expert/query', {
  method: 'POST',
  body: JSON.stringify({
    domain: 'fitness',
    query: 'best time for gym to avoid crowd?'
  })
});

// Trigger SOS
await fetch('http://localhost:4026/api/care/sos', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user123',
    location: { lat: 12.9, lng: 77.6 },
    type: 'panic'
  })
});
```
