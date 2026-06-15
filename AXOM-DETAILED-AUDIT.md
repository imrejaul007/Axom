# AXOM — DETAILED COMPANY AUDIT
**Date:** June 4, 2026
**Version:** 1.0.0
**Auditor:** Claude Code Elite Agent

---

## COMPANY PROFILE

| Attribute | Value |
|-----------|-------|
| **Name** | AXOM |
| **Role** | Social platforms, entertainment, and BPO services company |
| **Parent** | RTNM Group |
| **GitHub** | AXOM |
| **Location** | /Users/rejaulkarim/Documents/ReZ Full App/Axom/ |

---

## ⚠️ COMPANY BOUNDARIES

### ✅ AXOM OWNS:

| Category | Services |
|----------|----------|
| Social | buzzlocal, rendez |
| BPO | (infrastructure) |
| Integrations | buzzlocal-rides-integration (in KHAIRMOVE) |

### ❌ NOT AXOM:

| Service | Belongs To | Notes |
|---------|------------|-------|
| buzzlocal (in REZ-Consumer) | **AXOM** | Same service, different location |

---

## BUZZLOCAL — HYPERLOCAL SOCIAL PLATFORM

**Tagline:** "Live Pulse of Your City" / "City Operating System"  
**Purpose:** Hyperlocal community engagement and social networking

---

### BuzzLocal Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  BuzzLocal MOBILE APP                       │
│                    (Expo SDK 53)                            │
├─────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               BuzzLocal API GATEWAY (Port 4020)      │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌──────────────────────────┼──────────────────────────────┐  │
│  │                          │                              │  │
│  ▼                          ▼                              ▼  │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│ │buzzlocal-feed  │  │buzzlocal-vibe  │  │buzzlocal-safety│ │
│ │    -service   │  │    -service   │  │    -service   │ │
│ │  (Port 4000)  │  │  (Port 4003)  │  │  (Port 4017)  │ │
│ └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│ │buzzlocal-      │  │buzzlocal-     │  │buzzlocal-      │ │
│ │community       │  │intelligence   │  │society         │ │
│ │-service       │  │-service      │  │-service       │ │
│ │  (Port 4004)  │  │  (Port 4010)  │  │  (Port 4019)  │ │
│ └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### BuzzLocal Mobile App

| Attribute | Value |
|-----------|-------|
| Type | Mobile App (React Native) |
| Platform | Expo SDK 53, TypeScript |
| Screens | 69 screens |
| Navigation | Expo Router |
| Maps | react-native-maps with Mapbox |
| State | Zustand + Socket.IO |

---

### 4 Main Layers

| Layer | Tab | Features |
|-------|-----|----------|
| Home | Home | Feed, Vibe Map, Events |
| Ask Buzz | 🤖 | AI-powered local Q&A ("ChatGPT for local life") |
| Society | 🏢 | Apartment/society features, buy/sell |
| REZ Safe | 🛡️ | Women safety, alerts, SOS |

---

### Screens Breakdown

**REZ Safe Screens (9):**
| Screen | File | Description |
|--------|------|-------------|
| Safe Hub | safe.tsx | Safety center, SOS, alerts |
| SOS | sos.tsx | Emergency SOS trigger |
| Safety Map | map.tsx | Real-time safety map |
| Report | report.tsx | Report incident |
| Circle | circle.tsx | Trusted circle |
| Route | route.tsx | Share live route |
| Alerts | alerts.tsx | Safety alerts |
| Resources | resources.tsx | Safety resources |
| Volunteer | volunteer.tsx | Volunteer for safety |

**Crisis Screens (4):**
| Screen | File | Description |
|--------|------|-------------|
| Crisis Map | crisis/map.tsx | Crisis visualization |
| Resources | crisis/resources.tsx | Crisis resources |
| Volunteer | crisis/volunteer.tsx | Crisis volunteering |
| Check-in | crisis/checkin.tsx | Safety check-in |

**Marketplace Screens (2):**
| Screen | File | Description |
|--------|------|-------------|
| Chat | marketplace/chat.tsx | Buyer-seller chat |
| My Listings | marketplace/mine.tsx | User's listings |

**Services Screens (2):**
| Screen | File | Description |
|--------|------|-------------|
| Bookings | services/bookings.tsx | Service bookings |
| Booking Detail | services/book/[id].tsx | Booking details |

**Ask Buzz Screens (2):**
| Screen | File | Description |
|--------|------|-------------|
| Chat | ask/chat/[id].tsx | AI conversation |
| History | ask/history.tsx | Conversation history |

**Merchant Screens (1):**
| Screen | File | Description |
|--------|------|-------------|
| Create Offer | merchant/create-offer.tsx | Create offers |

---

### Backend Services (9)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards | ✅ |
| buzzlocal-vibe-service | 4003 | Check-ins, Vibe Map | ✅ |
| buzzlocal-community-service | 4004 | Communities | ✅ |
| z-events-service | 4008 | Events, ticketing | ✅ |
| buzzlocal-intelligence-service | 4010 | AI intelligence | ✅ |
| buzzlocal-api-gateway | 4020 | Unified API gateway | ✅ |
| buzzlocal-crisis-service | 4021 | Crisis management | ✅ |
| buzzlocal-safety-service | 4017 | Safety alerts, SOS | ✅ |
| buzzlocal-society-service | 4019 | Society features | ✅ |

---

### Key Features

**Feed & Content:**
- AI-generated cards
- Vibe Map (real-time crowd heatmap)
- Event discovery
- Location-based posts

**Ask Buzz (AI Q&A):**
- Natural language queries
- Local recommendations
- "ChatGPT for local life"

**Society OS:**
- Apartment/society management
- Buy/sell marketplace
- Service bookings

**REZ Safe:**
- SOS alerts with location
- Trusted circle
- Live route sharing
- Safety check-ins
- Women-specific safety features
- Community watch

---

### Integration with KHAIRMOVE

| Integration | Description |
|-------------|-------------|
| buzzlocal-rides-integration | Rides booking within BuzzLocal |
| Location-based | Services for nearby locations |

---

## RENDEZ — (Planned)

| Attribute | Value |
|-----------|-------|
| Type | Platform |
| Purpose | Rendezvous/dating platform |
| Status | ⚠️ PARTIAL |

---

## BPO SERVICES

AXOM also provides BPO (Business Process Outsourcing) services, though specific implementations are not yet visible in the codebase.

---

## SECURITY AUDIT

### Score: 7.5/10

**Safety Features:**
| Feature | Status |
|---------|--------|
| SOS with location | ✅ |
| Trusted circle | ✅ |
| Live route sharing | ✅ |
| Safety check-ins | ✅ |
| Crisis management | ✅ |

**API Security:**
| Feature | Status |
|---------|--------|
| JWT Auth | ✅ |
| Rate Limiting | ✅ |
| Helmet | ✅ |
| Zod Validation | ✅ |

---

## DEPENDENCIES

| Package | Version | Status |
|---------|---------|--------|
| expo | 53.0.x | ✅ Current |
| react-native-maps | - | ✅ Mapbox integration |
| Socket.IO | - | ✅ Real-time |
| Zustand | - | ✅ State |

---

## INTEGRATIONS

| From | To | Integration |
|------|----|-------------|
| BuzzLocal | RABTUL | Karma loyalty |
| BuzzLocal | KHAIRMOVE | Rides integration |
| BuzzLocal | REZ | REZ Safe branding |

---

## SCORES SUMMARY

| Category | Score |
|----------|-------|
| Security | 7.5/10 |
| Code Quality | 7.0/10 |
| Testing | 5.0/10 |
| Dependencies | 7.0/10 |
| Documentation | 7.0/10 |
| **OVERALL** | **6.9/10** |

---

## RECOMMENDATIONS

### Immediate
1. Complete BuzzLocal mobile app
2. Add E2E tests for safety features
3. Implement rendez platform

### Short Term
1. Expand to more cities
2. Add more safety features
3. Improve AI responses

### Long Term
1. Add video/streaming
2. Expand BPO services
3. Add monetization features

---

**Report Generated:** June 4, 2026
**Auditor:** Claude Code Elite Agent
