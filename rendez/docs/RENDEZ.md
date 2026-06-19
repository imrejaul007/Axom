# Rendez - Complete Documentation

**Version:** 2.0 | **Company:** Axom | **Type:** Social Connecting Platform  
**Status:** ✅ COMPLETE | **Port:** TBD

---

## Vision

> **"Find people. Meet safely. Build relationships. Do things together."**

Rendez is a **Relationship OS** that combines dating, networking, events, AI matchmaking, and commerce—powered by the REZ ecosystem.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RENDEZ PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      DISCOVERY LAYER                               │  │
│  │  Swipe │ AI Picks │ Nearby │ Events │ Business │ Blind Match      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      CONNECTION LAYER                              │  │
│  │  Match │ Chat │ Gifts │ Plans │ Video Call                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      SAFETY LAYER                                   │  │
│  │  SOS │ Verification │ Live Tracking │ Safe Timer │ Reports         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      AI LAYER                                       │  │
│  │  Compatibility │ Suggestions │ Chat Assistant │ Safety Analysis      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      REZ ECOSYSTEM                                 │  │
│  │  Wallet │ Events │ Genie AI │ MemoryOS │ Merchant Network        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## App Structure

```
rendez-app/
├── src/
│   ├── screens/
│   │   ├── ai/
│   │   │   ├── AICompatibilityScreen.tsx    ✅ NEW
│   │   │   └── AIChatAssistantScreen.tsx    ✅ NEW
│   │   ├── safety/
│   │   │   └── SafetyScreen.tsx             ✅ NEW
│   │   ├── couple/
│   │   │   └── CoupleModeScreen.tsx         ✅ NEW
│   │   ├── networking/
│   │   │   └── BusinessNetworkingScreen.tsx ✅ NEW
│   │   ├── events/
│   │   │   └── EventsScreen.tsx             ✅ NEW
│   │   ├── OnboardingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   ├── DiscoverScreen.tsx
│   │   ├── MatchesScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── PlansScreen.tsx
│   │   ├── MeetupScreen.tsx
│   │   ├── GiftPickerScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── api.ts                          # Main API client
│   │   ├── ai/
│   │   │   └── matchmaking.ts              ✅ NEW - AI Matchmaking
│   │   ├── safety/
│   │   │   └── safety.ts                   ✅ NEW - Safety Service
│   │   └── events/
│   │       └── rendezEvents.ts             ✅ NEW - Z-Events Integration
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── types/
│   │   └── api.ts
│   ├── constants/
│   │   └── index.ts
│   └── store/
├── rendez-backend/                        # Node.js/Express Backend
│   └── dist/
│       ├── routes/                       # 20+ route handlers
│       ├── services/                      # 67 business services
│       ├── workers/                       # Background job processors
│       ├── middleware/                    # Auth, rate limiting
│       ├── realtime/                      # Socket.io server
│       └── integrations/                  # REZ ecosystem clients
└── rendez-admin/                          # Admin Dashboard
```

---

## Screens (Complete)

| Screen | File | Description | Status |
|--------|------|-------------|--------|
| **Onboarding** | `OnboardingScreen.tsx` | Welcome flow | ✅ |
| **Login** | `LoginScreen.tsx` | Phone OTP auth | ✅ |
| **Profile Setup** | `ProfileSetupScreen.tsx` | Create profile | ✅ |
| **Discover** | `DiscoverScreen.tsx` | Swipe matching | ✅ |
| **Matches** | `MatchesScreen.tsx` | Your matches | ✅ |
| **Chat** | `ChatScreen.tsx` | Messaging | ✅ |
| **Plans** | `PlansScreen.tsx` | Social plans | ✅ |
| **Meetup** | `MeetupScreen.tsx` | Date planning | ✅ |
| **Gifts** | `GiftPickerScreen.tsx` | Send gifts | ✅ |
| **Profile** | `ProfileScreen.tsx` | User profile | ✅ |
| **Settings** | `SettingsScreen.tsx` | App settings | ✅ |
| **AI Compatibility** | `AICompatibilityScreen.tsx` | Match analysis | ✅ NEW |
| **AI Chat Assistant** | `AIChatAssistantScreen.tsx` | Genie in chat | ✅ NEW |
| **Safety Center** | `SafetyScreen.tsx` | SOS & verification | ✅ NEW |
| **Couple Mode** | `CoupleModeScreen.tsx` | Shared timeline | ✅ NEW |
| **Business Network** | `BusinessNetworkingScreen.tsx` | Founder/investor | ✅ NEW |
| **Events** | `EventsScreen.tsx` | Event discovery | ✅ NEW |

---

## Features (Complete)

### 1. Discovery Modes ✅

| Mode | Description |
|------|-------------|
| **Classic Swipe** | Like/Pass cards |
| **AI Picks** | Daily curated matches |
| **Nearby** | Location-based discovery |
| **Events** | Meet at events |
| **Business** | Founder/investor matching |
| **Intent Mode** | Filter by purpose |

### 2. AI Matchmaking ✅ NEW

| Feature | Description |
|---------|-------------|
| **Compatibility Score** | 0-100% match |
| **Breakdown** | Personality, interests, lifestyle, values, communication |
| **Reasons** | Why you match |
| **Strengths** | Relationship strengths |
| **Challenges** | Growth areas |
| **AI Summary** | Personalized insight |
| **Personality Profile** | MBTI, love language, attachment style |

### 3. Safety Features ✅ NEW

| Feature | Description |
|---------|-------------|
| **SOS Emergency** | One-tap emergency alert |
| **Emergency Contacts** | Up to 5 trusted contacts |
| **Live Location Sharing** | Share with matches |
| **Safe Date Timer** | Auto-alert after set time |
| **Verification Badges** | Phone, email, selfie, ID, LinkedIn, Instagram |
| **Block & Report** | Report fake/problematic users |
| **Screenshot Detection** | Alert when screenshots taken |
| **Safe Zones** | Home, work, custom zones |

### 4. AI Chat Assistant ✅ NEW

| Feature | Description |
|---------|-------------|
| **Reply Suggestions** | AI-powered responses |
| **Ice Breakers** | Conversation starters |
| **Date Ideas** | AI-recommended dates |
| **Gift Suggestions** | Personalized gift ideas |
| **Reminders** | Important dates, check-ins |
| **Translation** | Multi-language support |
| **Scam Detection** | AI-powered fraud prevention |

### 5. Couple Mode ✅ NEW

| Feature | Description |
|---------|-------------|
| **Relationship Timeline** | Milestones, firsts, anniversaries |
| **Shared Bucket List** | Couple goals |
| **Expense Splitting** | Track shared expenses |
| **Goals Tracker** | Savings, trips, dreams |
| **Photo Memories** | Shared photo albums |

### 6. Business Networking ✅ NEW

| Mode | Description |
|------|-------------|
| **Founder Match** | Find co-founders |
| **Investor Match** | Connect with angels/VCs |
| **Mentor Match** | Get guidance from experts |
| **Freelancer Match** | Find talent or work |

### 7. Events Integration ✅ NEW

| Feature | Description |
|---------|-------------|
| **Event Discovery** | Browse events by category |
| **Attendee Matching** | See who else is going |
| **Compatibility** | AI compatibility with attendees |
| **Connect Before** | Chat before event |
| **Group Chats** | Event-specific groups |
| **Post-Event** | Share memories, review |

### 8. Commerce Integration

| Feature | Description |
|---------|-------------|
| **REZ Wallet** | Coins, cashback, rewards |
| **Gift Catalog** | Virtual & real gifts |
| **Vouchers** | Merchant vouchers |
| **Experience Credits** | Premium experiences |

---

## Backend Services (67 Total)

### Core Services
| Service | Purpose |
|---------|---------|
| MatchService | Matching algorithm |
| DiscoveryService | User discovery |
| MessagingService | Real-time chat |
| MeetupService | Date planning |
| GiftService | Gift exchange |
| PlanService | Social plans |

### AI Services
| Service | Purpose |
|---------|---------|
| AICompatibilityService | Match scoring |
| AIConversationService | Chat suggestions |
| AISafetyService | Fraud detection |

### Safety Services
| Service | Purpose |
|---------|---------|
| SafetyService | Emergency alerts |
| VerificationService | Identity verification |
| ReportService | User reports |
| BlockService | Blocking |

### Ecosystem Services
| Service | Purpose |
|---------|---------|
| WalletService | REZ coins |
| LoyaltyService | Points & rewards |
| NotificationService | Push notifications |
| EventBusService | REZ Event Bus |

---

## API Routes (20+)

| Route | Description |
|-------|-------------|
| `/auth/*` | Authentication |
| `/profile/*` | Profile management |
| `/discover/*` | Discovery settings |
| `/matches/*` | Match management |
| `/messaging/*` | Chat endpoints |
| `/meetup/*` | Date planning |
| `/plans/*` | Social plans |
| `/gift/*` | Gift system |
| `/karma/*` | Karma scoring |
| `/wallet/*` | Coins & rewards |
| `/safety/*` | Safety features |
| `/verify/*` | Verification |
| `/referral/*` | Referrals |
| `/admin/*` | Admin endpoints |
| `/oauth/*` | Social login |
| `/webhooks/*` | External integrations |

---

## Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#6366f1` | Main actions |
| Accent | `#8b5cf6` | Highlights |
| Success | `#10b981` | Success states |
| Warning | `#f59e0b` | Warnings |
| Error | `#ef4444` | Errors |
| Background | `#0f0f23` | Dark mode bg |
| Card | `#1a1a2e` | Card surfaces |

### Typography
| Style | Size | Weight |
|-------|------|--------|
| H1 | 28px | 700 |
| H2 | 24px | 700 |
| H3 | 20px | 600 |
| Body | 16px | 400 |
| Caption | 13px | 400 |

---

## Environment Variables

```env
# Service
PORT=4009
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=your-secret
INTERNAL_SERVICE_TOKEN=your-token

# REZ Ecosystem
REZ_AUTH_URL=http://localhost:4002
REZ_WALLET_URL=http://localhost:4004
REZ_LOYALTY_URL=http://localhost:4040
GENIE_GATEWAY_URL=http://localhost:4701
Z_EVENTS_URL=http://localhost:4008

# External
CLOUDINARY_URL=cloudinary://...
SENDGRID_API_KEY=SG...
TWILIO_SID=...
TWILIO_TOKEN=...
```

---

## Deployment

```bash
# Install dependencies
cd rendez-backend && npm install

# Build
npm run build

# Start
npm start

# Or with Docker
docker-compose up -d
```

---

## Competitive Advantage

| Feature | Tinder | Bumble | Hinge | **Rendez** |
|---------|--------|--------|-------|-----------|
| AI Matchmaking | ❌ | ❌ | ❌ | ✅ |
| Events Matching | ❌ | ❌ | ❌ | ✅ |
| Safety Center | Basic | Basic | Basic | **Full** |
| Couple Mode | ❌ | ❌ | ❌ | ✅ |
| Business Network | ❌ | ❌ | ❌ | ✅ |
| REZ Ecosystem | ❌ | ❌ | ❌ | ✅ |
| AI Chat Assistant | ❌ | ❌ | ❌ | ✅ |
| Verification | Phone | Phone | Phone | **Multi-level** |
| Wallet & Coins | ❌ | ❌ | ❌ | ✅ |

---

## License

Proprietary - Axom / REZ Ecosystem

---

*Last Updated: June 17, 2026*
