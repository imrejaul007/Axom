# BuzzLocal Persona Service

**Port:** 4025
**Purpose:** Identity Personas for contextual app experience

---

## Personas (14 Types)

| Persona | Icon | Description |
|---------|------|-------------|
| Food Scout | 🍔 | Discovers local food |
| Nightlife Hunter | 🌙 | Knows where the party is |
| Fitness Enthusiast | 💪 | Health & workout focused |
| Deal Hunter | 🏷️ | Always finds bargains |
| Event Insider | 🎭 | Never misses events |
| Society Guardian | 🏠 | Community safety |
| Startup Insider | 🚀 | Startup ecosystem |
| Campus Leader | 🎓 | Campus connected |
| Safety First | 🛡️ | Safety priority |
| Commuter | 🚇 | Transit master |
| Home Body | 🏡 | Loves staying in |
| Explorer | 🗺️ | Discovers new places |
| Early Bird | 🐦 | Morning person |
| Late Owl | 🦉 | Night owl |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personas/definitions` | All persona definitions |
| GET | `/api/personas/me` | Current user persona |
| POST | `/api/personas/detect` | Detect persona from behavior |
| GET | `/api/personas/contextual` | Get contextual UI surface |
| GET | `/api/personas/streaks` | User streaks |
| POST | `/api/personas/activity` | Log activity |
| PUT | `/api/personas/traits` | Update traits |
| POST | `/api/personas/claim/:type` | Claim persona |
| GET | `/api/personas/leaderboard/:type` | Persona leaderboard |
| GET | `/api/personas/stats` | Persona distribution |

---

## Contextual Surfacing

The service determines what features to show based on:

1. **Persona** - Primary user identity
2. **Time** - Morning, afternoon, evening, night, late_night
3. **Location** - Home, work, commuting, exploring, social
4. **Day** - Weekday or weekend

### Example

```typescript
// Food Scout at 8 PM on weekend
GET /api/personas/contextual?time=evening&location=exploring&dayOfWeek=weekend

// Response prioritizes:
// - offers (deals are important)
// - vibe_map (discover places)
// - events (something happening)
// - hide: safety alerts (not priority)
```

---

## Integration

### With REZ Unified Identity

```typescript
// Fetch persona from BuzzLocal
const persona = await fetch('http://localhost:4025/api/personas/me', {
  headers: { 'x-user-id': userId }
});

// Use persona to customize feed
const surface = await fetch('http://localhost:4025/api/personas/contextual?...');

// Apply UI overrides
dispatch(setTabOrder(surface.uiOverrides.tabOrder));
dispatch(setHeroSection(surface.uiOverrides.heroSection));
```

### With REZ Personalization Engine

```typescript
// Combine persona + behavioral profile
const [persona, profile] = await Promise.all([
  buzzlocalPersona.getMyPersona(),
  personalization.getProfile(userId),
]);

// Generate hybrid recommendations
const recommendations = combineSignals(persona, profile);
```
