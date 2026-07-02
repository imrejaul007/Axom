# BuzzLocal City OS

**Position:** "Live Pulse of Your City" / "City Operating System"
**Last Updated:** 2026-06-22

---

## Documentation Status (2026-06-22)

This file is a navigation/index doc. Primary content lives in:

- **[SPEC.md](SPEC.md)** — app features spec (last bumped 2026-06-22, originally 2026-05-19)
- **[CITY-OS-SPEC.md](CITY-OS-SPEC.md)** — City OS technical spec
- **[AUDIT.md](AUDIT.md)** — older audit (May 14, 2026, 18 screens / 9 services) — **superseded**, see drift note below
- **[STRATEGIC-VISION.md](STRATEGIC-VISION.md)** — strategic positioning

### Known drift as of 2026-06-22

- The service ports listed below in "Backend Services" (4000-4008 and the City OS set 4015-4026) are **documented but not verified as live**. Spot-checks on 4000, 4001, 4003, 4004, 4008, 4010, 4020 all returned connection refused.
- The actual `app/` directory has grown beyond what AUDIT.md describes — see new subdirs: `ask/`, `safe/`, `crisis/`, `marketplace/`, `services/`, `society/`, `corpperks/`, `creators/`, `delivery/`, `movement/`, `offers/`, `onboarding/`, `rides/`, `stayown/`, `analytics/`, `kiosks.tsx`. SPEC.md (City OS, 69 screens) is the closer match.
- Two files disagree on the API gateway port: this file says 4020, SOT.md says 4000. **Unresolved** — not changed in this pass.

---

## Service Discovery

This service is registered in REZ-Master/services.json.

To discover related services:
```bash
# From REZ-Master directory
node rez-cli find <service-name>  # Find specific service
node rez-cli list --category <category>  # List by category
node rez-cli stats  # Platform statistics
```

Quick search:
- `node rez-cli list --search payment` - Find payment services
- `node rez-cli list --search auth` - Find auth services
- `node rez-cli list --search kds` - Find KDS services
- `node rez-cli list --search ai` - Find AI services

---

Hyperlocal social + discovery app for the ReZ ecosystem. Users find all local info (events, news, places, offers) and earn ReZ Coins for contributing.

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

## Premium UI/UX Design System

All screens follow a premium design language with consistent visual patterns:

### Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `BORDER_RADIUS.xl` | 16px | Cards, buttons, modals |
| `BORDER_RADIUS.lg` | 12px | Inputs, chips |
| `BORDER_RADIUS.md` | 8px | Small elements |
| `SPACING.lg` | 16px | Section padding |
| `SPACING.md` | 12px | Card padding |
| `SPACING.sm` | 8px | Compact spacing |

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#6366F1` | Buttons, accents |
| Secondary | `#8B5CF6` | Gradients, highlights |
| Success | `#10B981` | Safe, confirmations |
| Warning | `#F59E0B` | Alerts, caution |
| Error | `#EF4444` | SOS, errors |
| Background | `#0F0F1A` | App background |
| Card | `#1A1A2E` | Card surfaces |

### Component Patterns

#### Gradient Buttons
```tsx
<LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.button}>
  <Text style={styles.buttonText}>Label</Text>
</LinearGradient>
```

#### Gradient Icons
```tsx
<LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.iconContainer}>
  <Ionicons name="icon" size={24} color="#fff" />
</LinearGradient>
```

#### Animated Send Button
```tsx
const sendAnim = useRef(new Animated.Value(1)).current;

const animateSend = () => {
  Animated.sequence([
    Animated.timing(sendAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    Animated.spring(sendAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
  ]).start();
};
```

#### Premium Cards
```tsx
<View style={styles.card}>
  <LinearGradient colors={['rgba(99, 102, 241, 0.1)', 'transparent']} style={styles.cardGradient}>
    <View style={styles.cardContent}>
      {/* Content */}
    </View>
  </LinearGradient>
</View>
```

### Screen Categories with Premium UI

| Category | Screens | Features |
|----------|---------|----------|
| **REZ Safe** | `safe.tsx`, `sos.tsx`, `report.tsx` | Safety scores, SOS triggers, emergency contacts |
| **Crisis** | `map.tsx`, `resources.tsx`, `volunteer.tsx`, `checkin.tsx` | Crisis zones, resource claims, volunteer registration |
| **Marketplace** | `chat.tsx`, `mine.tsx` | Buyer-seller messaging, listing management |
| **Services** | `bookings.tsx`, `book/[id].tsx` | Service booking, schedule management |
| **Ask Buzz** | `chat/[id].tsx`, `history.tsx` | AI conversations, query history |
| **Merchant** | `create-offer.tsx` | Offer creation with preview |

### Animation Guidelines
- **Press feedback:** `scale: 0.95` with `Animated.spring`
- **Typing indicator:** Bouncing dots with staggered `Animated.timing`
- **Pulse effects:** `Animated.loop` with `Animated.sequence`
- **Send animation:** Scale down then spring back

### Icon Library
- **Package:** `@expo/vector-icons` (Ionicons)
- **Usage:** `icon as any` for type safety with Ionicon name union

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

## Backend Services (buzzlocal-services/)

### Core Services
| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Check-ins, Vibe Map |
| buzzlocal-community-service | 4004 | Communities |
| z-events-service | 4008 | Events, ticketing |
| buzzlocal-intelligence-service | 4010 | AI intelligence |

### City OS Services
| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-api-gateway | 4020 | Unified API gateway |
| buzzlocal-crisis-service | 4021 | Crisis management |
| buzzlocal-density-service | 4022 | Area density tracking |
| buzzlocal-merchant-offer-service | 4023 | Merchant offers |
| buzzlocal-services-service | 4024 | Local services directory |
| buzzlocal-ask-service | 4015 | Ask Buzz Q&A |
| buzzlocal-trust-service | 4016 | Trust scores |
| buzzlocal-safety-service | 4017 | Safety alerts, SOS |
| buzzlocal-agency-service | 4018 | BBMP, weather |
| buzzlocal-society-service | 4019 | Society features |

### Supporting Services
| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-creator-service | - | Content creators |
| buzzlocal-persona-service | - | User personas |
| buzzlocal-movement-service | - | Movement tracking |
| buzzlocal-realtime-service | - | Real-time events |
| buzzlocal-payment-service | - | Payments |
| buzzlocal-notification-service | - | Notifications |
| buzzlocal-weather-service | - | Weather data |

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
| Expert Services | Domain answers |

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

## Documentation

- [CITY-OS-SPEC.md](CITY-OS-SPEC.md) - Complete City OS specification
- [SPEC.md](SPEC.md) - Original app specification

## Related

- [buzzlocal-services](../buzzlocal-services/) - All backend services
- [REZ-Consumer](../REZ-Consumer/) - Main consumer app
- [RABTUL-Technologies](../RABTUL-Technologies/) - Infrastructure services
- [REZ-Intelligence](../REZ-Intelligence/) - AI services
