# BuzzLocal City OS

**Position:** "Live Pulse of Your City" / "City Operating System"
**Company:** AXOM
**Location:** `/Axom/buzzlocal/mobile/`

---

## Service Discovery

This service is registered in REZ-Master/services.json.

To discover related services:
```bash
node rez-cli find <service-name>  # Find specific service
node rez-cli list --category buzzlocal  # List buzzlocal services
```

---

## City OS - 4 Main Layers

| Layer | Tab | Features |
|-------|-----|---------|
| **Home** | Home | Feed, Vibe Map, Events |
| **Ask Buzz** | 🤖 | AI-powered local Q&A ("ChatGPT for local life") |
| **Society** | 🏢 | Apartment/society features, buy/sell |
| **REZ Safe** | 🛡️ | Women safety, alerts, SOS |

---

## Screens (City OS) - 69 Total

### Main Navigation (app/(main)/)
| Screen | File | Description |
|--------|------|-------------|
| Home Feed | `index.tsx` | Feed with AI cards, posts, alerts |
| Vibe Map | `vibe-map.tsx` | Real-time crowd heatmap |
| Ask Buzz | `ask.tsx` | AI-powered local Q&A |
| **Safe Hub** | `safe.tsx` | Safety center, SOS, alerts |
| Society | `community.tsx` | Apartment features, buy/sell |
| Events | `events.tsx` | Local events discovery |
| Explore | `explore.tsx` | Search & discover |
| Places | `places.tsx` | Nearby places with vibe scores |
| Alerts | `alerts.tsx` | Safety alerts |
| Weather | `weather.tsx` | Local weather |
| Profile | `profile.tsx` | User profile |
| Scan QR | `scan.tsx` | QR scanner |
| Place Details | `place/[id].tsx` | Detailed place view |

### Authentication (app/(auth)/)
| Screen | File | Description |
|--------|------|-------------|
| Welcome | `index.tsx` | Welcome/onboarding |
| Location | `location.tsx` | Location permission |
| Interests | `interests.tsx` | Interest selection |
| Connect | `connect-account.tsx` | Account linking |

### Ask Buzz (app/ask/)
| Screen | File | Description |
|--------|------|-------------|
| Results | `results.tsx` | AI answer with sources |
| Chat | `chat/[id].tsx` | Conversation with Ask Buzz |
| History | `history.tsx` | Past conversations |

### REZ Safe (app/safe/)
| Screen | File | Description |
|--------|------|-------------|
| **SOS** | `sos.tsx` | Emergency trigger (4 types) |
| **Safe Map** | `map.tsx` | Safe zone map |
| **Report** | `report.tsx` | Report incident |
| Trusted Circle | `circle.tsx` | Emergency contacts |
| Safe Route | `route.tsx` | Safe navigation |
| Active Alert | `alerts/[id].tsx` | Alert details |

### Crisis (app/crisis/)
| Screen | File | Description |
|--------|------|-------------|
| Crisis Hub | `index.tsx` | Crisis management center |
| **Crisis Map** | `map.tsx` | Crisis zone visualization |
| **Resources** | `resources.tsx` | Emergency supplies |
| **Volunteer** | `volunteer.tsx` | Volunteer registration |
| **Check-In** | `checkin.tsx` | Safety check-in |

### Marketplace (app/marketplace/)
| Screen | File | Description |
|--------|------|-------------|
| Browse | `index.tsx` | Product listings |
| Details | `[id].tsx` | Product detail |
| Create | `create.tsx` | Create listing |
| **Chat** | `chat.tsx` | Buyer-seller chat |
| **My Listings** | `mine.tsx` | Manage listings |

### Services (app/services/)
| Screen | File | Description |
|--------|------|-------------|
| Browse | `index.tsx` | Service categories |
| Provider | `[id].tsx` | Service provider profile |
| **Book** | `book/[id].tsx` | Book service |
| **Bookings** | `bookings.tsx` | My bookings |

### Merchant (app/merchant/)
| Screen | File | Description |
|--------|------|-------------|
| Dashboard | `dashboard.tsx` | Merchant dashboard |
| Insights | `insights.tsx` | Analytics |
| **Create Offer** | `create-offer.tsx` | Create offer/coupon |

### Profile (app/profile/)
| Screen | File | Description |
|--------|------|-------------|
| Trust Score | `trust.tsx` | Trust verification |
| Persona | `persona.tsx` | User persona |

### Other Features
| Screen | File | Description |
|--------|------|-------------|
| Create Post | `create.tsx` | 6 post types |
| Create Event | `create-event.tsx` | Event creation |
| Create Community | `create-community.tsx` | Community setup |
| Notifications | `notifications.tsx` | All notifications |
| Search | `search.tsx` | Global search |
| Wallet | `wallet.tsx` | REZ Coins |

---

## New Features (City OS)

### 1. Ask Buzz - AI Local Assistant
- Natural language queries
- Category routing (Food, Safety, Services, Housing, Events, etc.)
- Trust-based answer priority
- Coin rewards for helpful answers

### 2. REZ Safe - Safety Infrastructure
- Safety score for areas
- SOS button with trusted circle notification
- Safety alerts with credibility scoring
- Women safety mode
- Emergency contacts

### 3. Society OS - Apartment Infrastructure
- Announcements from admins
- Visitor management
- Facility booking
- Buy/sell within society
- Maintenance requests

---

## Tech Stack

- **Framework:** React Native (Expo SDK 53)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **State:** Zustand
- **HTTP:** Axios
- **Maps:** react-native-maps with Mapbox
- **AI:** REZ Mind, Intent Predictor

---

## Build Commands

```bash
npm install              # Install dependencies
npx expo prebuild       # Generate native projects
npx expo run:android    # Run on Android
npx expo run:ios        # Run on iOS
npx expo start           # Start Expo DevTools
```

---

## Backend Services

The backend microservices are located in `/Axom/buzzlocal/backend/`:

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Check-ins, Vibe Map |
| buzzlocal-community-service | 4004 | Communities |
| z-events-service | 4008 | Events, ticketing |
| buzzlocal-intelligence-service | 4010 | AI intelligence |

---

## Reused from RABTUL

| Service | Purpose |
|---------|---------|
| `rez-auth-service` | Login, OTP, verification |
| `rez-wallet-service` | Coins, transactions |
| `rez-gamification-service` | Badges, streaks, trust |
| `rez-notifications-service` | Push notifications |

---

## REZ Intelligence Used

| Service | Purpose |
|---------|---------|
| `intent-predictor` | Ask Buzz AI |
| `location-intelligence` | Neighborhood clustering |
| `unified-profile` | Trust calculation |
| `merchant-intelligence` | Services ranking |

---

## Data Collection

All user actions tracked for REZ Mind AI training:

```
ask_query, ask_answer, safety_alert, safety_sos
check_in, check_out, post_view, post_like
event_view, event_rsvp, offer_view, community_join
```

---

## Security

- NEVER commit `.env` files
- Store tokens in SecureStore
- Validate all API responses
- Sanitize user inputs
- Verify all auth tokens

---

## Related

- [backend/](backend/) - Backend microservices
- [REZ-Consumer](../REZ-Consumer/) - Cross-reference only (migrated)
- [RABTUL-Technologies](../RABTUL-Technologies/) - Infrastructure services
- [REZ-Intelligence](../REZ-Intelligence/) - AI services
