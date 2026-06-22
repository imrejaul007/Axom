# BuzzLocal City OS — Technical Specification

**Version:** 2.0.0
**Positioning:** "Live Pulse of Your City" / "City Operating System"
**Last Updated:** 2026-05-19

---

## Executive Summary

BuzzLocal is evolving from a hyperlocal social discovery app to **Urban Intelligence Infrastructure** — a real-time operating layer for urban life.

### Core Position

```
Not: Social app / Event app / Community app
But: City Operating System
```

### 4 Main Layers

| Layer | Purpose | Core Features |
|-------|---------|---------------|
| **Discover** | What's happening | Feed, Vibe Map, Trends, Events |
| **Ask** | Get answers | Ask Buzz AI, Local Q&A, Recommendations |
| **Community** | Connect locally | Societies, Neighborhoods, Groups |
| **Safe & Utility** | Stay informed | Alerts, Safety, Emergency, Public Updates |

### Strategic Assets Being Built

- Location Graph
- Trust Graph
- Event Graph
- Social Graph
- Commerce Graph
- Safety Graph
- Movement Graph

Combined: **Real-World Behavioral Intelligence**

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BuzzLocal City OS                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │Discover │  │   Ask   │  │Community│  │Safe &   │           │
│  │ Layer   │  │  Layer  │  │ Layer   │  │Utility  │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│       │            │            │            │                 │
│  ┌────┴────────────┴────────────┴────────────┴────┐           │
│  │              CITY INTELLIGENCE ENGINE            │           │
│  │  AI Cards │ Intent │ Recommendations │ Density │           │
│  └─────────────────────┬───────────────────────────┘           │
│                        │                                        │
│  ┌─────────────────────┴───────────────────────────┐           │
│  │              DATA GRAPH ENGINE                    │           │
│  │  Trust │ Safety │ Commerce │ Movement │ Social │           │
│  └─────────────────────┬───────────────────────────┘           │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
┌─────────┐        ┌─────────┐        ┌─────────┐
│ RABTUL  │        │   REZ   │        │ BUZZ    │
│ Platform│        │Intelligence│     │ LOCAL   │
│         │        │         │        │ Services│
└─────────┘        └─────────┘        └─────────┘
```

### 1.2 Data Flow Architecture

```
User Action ──► Service ──► REZ Mind
─────────────────────────────────────
Post View   ──► Feed ──► Content Taste
Check-in    ──► Vibe ──► Area Popularity
Ask Query   ──► Ask ──► Local Intelligence
Alert Post  ──► Safe ──► Safety Graph
Society Post──► Community──► Apartment Graph
```

---

## 2. Feature Specifications

### 2.1 ASK BUZZ — AI-Powered Local Q&A

**Position:** "ChatGPT for local life"

#### Overview
Natural language interface for all local queries. Powered by REZ Intelligence with human-in-the-loop verification.

#### User Queries Supported

| Category | Examples |
|----------|----------|
| **Food & Drink** | "Best biryani near Indiranagar?", "Late night café for working?" |
| **Safety** | "Safest route to MG Road?", "Well-lit areas near me?" |
| **Services** | "Best AC repair Koramangala?", "Reliable plumber nearby?" |
| **Housing** | "Good PG for girls near Electronic City?", "Quiet area for studying?" |
| **Events** | "Networking events tonight?", "Where is crowd shifting now?" |
| **Commerce** | "Which gym has shortest wait?", "Restaurant that's not crowded now?" |
| **Health** | "24hr pharmacy nearby?", "Good dermatologist with short wait?" |
| **Transport** | "Metro delay right now?", "Least traffic route to airport?" |

#### AI Pipeline

```
User Query → Intent Classification → Route to Expert/Graph
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              ┌──────────┐            ┌──────────┐            ┌──────────┐
              │REZ Mind  │            │Expert    │            │Community │
              │(Patterns)│            │Services  │            │Responses │
              └────┬─────┘            └────┬─────┘            └────┬─────┘
                   │                      │                      │
                   └──────────────────────┴──────────────────────┘
                                          │
                                   Response Synthesis
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                       ┌──────────┐            ┌──────────┐
                       │ AI Card  │            │ Human    │
                       │ (Fast)   │            │ Verified │
                       └──────────┘            └──────────┘
```

#### Features

| Feature | Description |
|---------|-------------|
| Natural Language | Free-form text queries |
| Voice Input | Speak your question |
| Image Query | Upload photo of place/problem |
| Context Awareness | Remembers conversation, location, preferences |
| Trusted Answers | Verified residents' answers highlighted |
| Multiple Sources | AI + Expert Services + Community |
| Follow-up | Continue conversation naturally |
| Save & Share | Save useful answers, share with friends |

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Ask Home | `app/(main)/ask.tsx` | Input + recent queries |
| Ask Results | `app/ask/[id].tsx` | AI answer + sources |
| Ask Conversation | `app/ask/chat/[id].tsx` | Multi-turn conversation |
| Ask History | `app/ask/history.tsx` | Past queries |

#### Trust Routing

| Answer Type | Priority | Badge |
|-------------|----------|-------|
| Verified Resident Answer | 1 (Highest) | ⭐ Trusted Local |
| Area Expert Answer | 2 | 🏆 Area Expert |
| AI + Verified | 3 | 🤖 AI Verified |
| AI Answer | 4 | 🤖 AI |
| Community Votes | 5 | 👥 Community |

#### Coin Rewards

| Action | Coins |
|--------|-------|
| Ask a question | 0 |
| Provide helpful answer | +15 |
| Answer marked helpful by 5+ | +25 |
| Answer verified by AI | +10 bonus |
| Become "Trusted Answerer" | Badge + 50 coins |

#### API Endpoints

```
POST /api/ask/query          - Submit query
GET  /api/ask/results/:id    - Get AI results
POST /api/ask/answer         - Submit answer
GET  /api/ask/history         - User query history
POST /api/ask/mark-helpful   - Mark answer helpful
```

---

### 2.2 TRUST & REPUTATION SYSTEM

**Position:** Real-world behavioral credit graph (non-financial)

#### Trust Score Components

| Component | Weight | Signals |
|-----------|--------|---------|
| Verification | 25% | Address, phone, ID verified |
| Activity | 25% | Posts, answers, events, check-ins |
| Accuracy | 20% | Helpful answers, verified alerts |
| Community | 15% | Followers, engagement, thanks |
| Safety | 15% | Verified safety reports, no spam |

#### Trust Levels

| Level | Score | Badge | Abilities |
|-------|-------|-------|-----------|
| New User | 0-49 | 🟢 New | Basic features |
| Verified | 50-99 | ✅ Verified | Can post, comment |
| Trusted | 100-249 | ⭐ Trusted | Can verify alerts |
| Expert | 250-499 | 🏆 Expert | Featured answers, boosts |
| Guardian | 500-999 | 🛡️ Guardian | Safety authority |
| Legend | 1000+ | 👑 Legend | Community leader |

#### Verification Methods

| Method | Points | Description |
|--------|--------|-------------|
| Phone Verify | +10 | OTP verification |
| Email Verify | +5 | Email verification |
| Address Verify | +25 | GPS + utility bill |
| Society Verify | +30 | Society admin confirms |
| ID Verify | +20 | Government ID upload |
| Merchant Verify | +15 | Business registration |

#### Neighborhood Badges

| Badge | Criteria | Icon |
|-------|----------|------|
| Explorer | Check-in 10 places | 🗺️ |
| Food Scout | 20 food posts | 🍔 |
| Night Owl | 10 late-night posts | 🦉 |
| Event Hunter | Attend 5 events | 🎯 |
| Safety Hero | 5 verified alerts | 🚨 |
| Helper | 20 helpful answers | 🤝 |
| Local Legend | 100+ followers in area | ⭐ |
| Truth Teller | 10 accurate reports | ✅ |
| Early Bird | Discover 5 new places | 🐦 |
| Social Butterfly | 50+ connections | 🦋 |

#### Area Leaderboards

| Leaderboard | Frequency | Rewards |
|-------------|-----------|---------|
| Top Contributors | Weekly | Featured answer slot |
| Most Helpful | Weekly | +50 coins |
| Safety Champions | Weekly | Guardian badge |
| Foodies | Weekly | Featured post slot |
| Events | Weekly | Early access events |
| Area Leaders | Monthly | Exclusive events |

#### API Endpoints

```
GET  /api/trust/score/:userId     - Get trust score
POST /api/trust/verify            - Submit verification
GET  /api/trust/badges/:userId    - Get badges
GET  /api/trust/leaderboard       - Get leaderboards
POST /api/trust/report            - Report suspicious user
```

---

### 2.3 REZ SAFE — Hyperlocal Safety System

**Position:** Women's safety + public safety intelligence

#### Safety Layers

| Layer | Color | Description |
|-------|-------|-------------|
| Well-lit Crowds | 🟢 Green | Active areas, open shops |
| Moderate | 🟡 Yellow | Some lighting, moderate activity |
| Caution | 🟠 Orange | Low lighting, sparse areas |
| Alert | 🔴 Red | Recent incidents |

#### Safety Features

| Feature | Description |
|---------|-------------|
| **Women Safety Mode** | Share location with trusted contacts |
| **Safe Route AI** | Well-lit, crowded, active route suggestions |
| **Crowd Safety Score** | Real-time area safety rating |
| **Verified Alerts** | AI + human verified safety reports |
| **Nearby Safety** | Show safe businesses, open places |
| **Emergency SOS** | One-tap emergency to contacts + authorities |
| **Safety Heatmap** | Visual safety overlay on Vibe Map |
| **Safe Places** | 24hr businesses, police stations, hospitals |

#### Alert Types

| Type | Icon | Color | Examples |
|------|------|-------|----------|
| Suspicious Activity | 👁️ | Orange | Unknown persons, loitering |
| Road Safety | 🚧 | Yellow | Potholes, broken lights, accidents |
| Crime | 🚨 | Red | Theft, harassment, assault |
| Natural Hazard | ⚠️ | Orange | Flood, storm, fire |
| Traffic | 🚦 | Yellow | Accidents, diversions, closures |
| Infrastructure | 🔧 | Gray | Power outage, water outage |

#### Alert Credibility System

```
Submit Alert → AI Check → Community Vote → Credibility Score
                                           │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              ┌──────────┐          ┌──────────┐          ┌──────────┐
              │Verified  │          │Unverified│          │ Suspicious│
              │(Green)  │          │(Yellow)  │          │  (Red)   │
              └──────────┘          └──────────┘          └──────────┘
```

#### Credibility Signals

| Signal | Weight |
|--------|--------|
| GPS matches alert location | +20 |
| Multiple reports same area | +30 |
| Trusted/Guardian user | +15 |
| Photo/video evidence | +25 |
| New/unverified user | -10 |
| Vague description | -15 |
| Previous false reports | -50 |

#### Women Safety Features

| Feature | Description |
|---------|-------------|
| **Trusted Circle** | 5 contacts who can see your location |
| **Auto Check-in** | Alert if you don't check in after X time |
| **Walk With Me** | Simulated phone call for safety |
| **Safe Rides** | Partner with ReZ Ride for safe transport |
| **Quiet Mode** | Discreet emergency without phone interaction |
| **Report Harassment** | One-tap harassment report |

#### Safety Map Layers

```
Map Controls:
├── 🔵 Safety Overlay (toggle)
├── 🟢 Well-lit areas
├── 🟡 Moderate safety
├── 🟠 Caution zones
├── 🔴 Active alerts
└── 🏥 Emergency services
```

#### SOS Emergency Flow

```
1. User taps SOS
2. Share location with trusted circle
3. Alert nearest authorities
4. Connect to emergency services
5. Auto-record audio (if enabled)
6. Send alert to nearby users (opt-in)
```

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Safety Center | `app/(main)/safe.tsx` | Safety dashboard |
| Safety Map | `app/safe/map.tsx` | Safety heatmap |
| Alert Detail | `app/safe/alert/[id].tsx` | Alert info |
| Report Alert | `app/safe/report.tsx` | Submit safety alert |
| Emergency SOS | `app/safe/sos.tsx` | SOS settings |
| Trusted Circle | `app/safe/circle.tsx` | Manage trusted contacts |

#### API Endpoints

```
GET  /api/safety/heatmap         - Get safety data
POST /api/safety/alert            - Submit alert
GET  /api/safety/alerts           - List alerts
POST /api/safety/verify           - Verify alert
POST /api/safety/sos              - Trigger SOS
GET  /api/safety/safe-route       - Get safe route
POST /api/safety/circle           - Manage trusted circle
```

---

### 2.4 PUBLIC AGENCY INTEGRATION

**Position:** Daily utility through government alerts

#### Alert Sources

| Agency | Alerts | Integration |
|--------|--------|------------|
| BBMP | Road closures, garbage, water | Webhook |
| BMLTA (Metro) | Delays, station updates | API |
| Traffic Police | Accidents, diversions | Webhook |
| IMD | Weather warnings | API |
| BESCOM | Power outages | API |
| BWSSB | Water supply | API |
| Fire Department | Fire alerts | Webhook |
| Police | Law & order | Webhook |

#### Alert Categories

| Category | Icon | Priority |
|----------|------|----------|
| Metro Delay | 🚇 | High |
| Traffic Alert | 🚦 | High |
| Weather Warning | 🌧️ | High |
| Power Outage | ⚡ | Medium |
| Water Outage | 💧 | Medium |
| Road Closure | 🚧 | Medium |
| Law & Order | 🚨 | High |
| Fire Alert | 🔥 | Critical |

#### Features

| Feature | Description |
|---------|-------------|
| **Live Feed** | Real-time agency alerts |
| **Nearby Filters** | Show only relevant to your area |
| **Smart Notifications** | Wake you only for critical alerts |
| **Source Verification** | Official source badges |
| **Action Links** | Direct to affected area on map |
| **Community Context** | Show user reports near agency alert |

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Public Alerts | `app/(main)/alerts.tsx` | Agency + community alerts |
| Alert Detail | `app/alerts/[id].tsx` | Full alert info |
| Alert Sources | `app/alerts/sources.tsx` | Manage alert subscriptions |

#### API Endpoints

```
GET  /api/alerts/public          - Get agency alerts
GET  /api/alerts/community       - Get community alerts
POST /api/alerts/webhook/:source - Receive agency webhook
GET  /api/alerts/sources         - List alert sources
POST /api/alerts/subscribe       - Subscribe to source
```

---

### 2.5 SOCIETY OS LITE — Apartment Infrastructure

**Position:** WhatsApp replacement for apartments + gated communities

#### India-Specific Features

| Feature | Description |
|---------|-------------|
| **Announcements** | Admin posts to all residents |
| **Maintenance Alerts** | Bills, due dates, complaints |
| **Visitor Management** | Pre-approve visitors, gate pass |
| **Common Area Booking** | Clubhouse, pool, tennis court |
| **Buy/Sell** | Within society only |
| **Domestic Help** | Directory, attendance, feedback |
| **Meeting Polls** | Society meeting scheduling |
| **Local Services** | Verified plumbers, electricians |

#### Society Types

| Type | Examples |
|------|----------|
| Apartment | Individual apartments, towers |
| Gated Community | Multiple blocks, common areas |
| Layout | Unplanned layouts, colonies |
| Campus | Office campuses, colleges |

#### Features by Role

| Role | Features |
|------|----------|
| **Resident** | View announcements, post, buy/sell, book facilities |
| **Secretary** | Post announcements, manage visitors, collect dues |
| **Admin** | All + member management, settings |
| **Security** | Visitor approval, emergency broadcast |

#### Community Features

| Feature | Description |
|---------|-------------|
| **Announcements** | Official posts from admin |
| **Emergency Board** | Urgent announcements |
| **Daily Updates** | Daily highlights digest |
| **Maintenance** | Bills, complaints, status |
| **Events** | Society events, festivals |
| **Classifieds** | Buy/sell within society |
| **Services** | Recommended vendors |

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Society Home | `app/(main)/society.tsx` | Society dashboard |
| Society Feed | `app/society/[id]/feed.tsx` | Announcements |
| Members | `app/society/[id]/members.tsx` | Member list |
| Facilities | `app/society/[id]/facilities.tsx` | Book common areas |
| Visitors | `app/society/[id]/visitors.tsx` | Visitor management |
| Classifieds | `app/society/[id]/marketplace.tsx` | Buy/sell |
| Admin Panel | `app/society/[id]/admin.tsx` | Admin controls |

#### API Endpoints

```
GET  /api/societies              - List user's societies
POST /api/societies              - Create society
GET  /api/societies/:id         - Get society details
POST /api/societies/:id/join    - Join society
POST /api/societies/:id/leave   - Leave society

# Announcements
GET  /api/societies/:id/announcements  - List announcements
POST /api/societies/:id/announcements   - Create announcement
PUT  /api/societies/:id/announcements/:aid - Update

# Facilities
GET  /api/societies/:id/facilities     - List facilities
POST /api/societies/:id/bookings       - Book facility

# Visitors
GET  /api/societies/:id/visitors       - List visitors
POST /api/societies/:id/visitors       - Add visitor
PUT  /api/societies/:id/visitors/:vid  - Approve/reject

# Classifieds
GET  /api/societies/:id/listings       - Marketplace listings
POST /api/societies/:id/listings       - Create listing
```

---

### 2.6 LOCAL MARKETPLACE

**Position:** Neighborhood buy/sell with trust

#### Categories

| Category | Examples |
|----------|----------|
| Furniture | Sofa, beds, tables, chairs |
| Electronics | Phones, laptops, appliances |
| Housing | PG, flatmates, sublet |
| Vehicles | Bikes, cycles, accessories |
| Books | Academic, fiction, entrance exams |
| Fashion | Clothes, accessories, thrift |
| Services | Tutors, freelancers, photographers |
| Events | Resale tickets |
| Kids | Toys, strollers, gear |

#### Features

| Feature | Description |
|---------|-------------|
| **Neighborhood Only** | See listings from nearby areas |
| **Trust Badges** | Seller reputation visible |
| **In-Person Meet** | Coordinate meetups safely |
| **REZ Coins** | Earn coins from verified sales |
| **Chat** | In-app messaging |
| **Photos** | Multiple photos with zoom |
| **Price Drop Alert** | Notify when price drops |
| **Similar Listings** | Show related items |

#### Listing Fields

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Item name |
| Category | Yes | Category selection |
| Price | Yes | Fixed or negotiable |
| Description | Yes | Details |
| Photos | Yes (1-5) | Item photos |
| Condition | Yes | New/like new/good/fair |
| Location | Auto | GPS or manual |
| Delivery | Optional | Available/not |

#### Trust Integration

| Signal | Display |
|--------|---------|
| Verified resident | ✅ Badge |
| High trust score | ⭐⭐⭐ |
| Previous sales | 🏆 Sold X items |
| Response time | ⚡ Usually responds in X mins |
| Verified phone | 📱 Phone verified |

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Marketplace | `app/(main)/marketplace.tsx` | Browse listings |
| Listing Detail | `app/marketplace/[id].tsx` | Item details |
| Create Listing | `app/marketplace/create.tsx` | Sell item |
| My Listings | `app/marketplace/mine.tsx` | Your items |
| Messages | `app/marketplace/chat/[id].tsx` | Chat with buyer/seller |

#### API Endpoints

```
GET  /api/marketplace/listings       - Browse listings
GET  /api/marketplace/listings/:id   - Get listing
POST /api/marketplace/listings       - Create listing
PUT  /api/marketplace/listings/:id   - Update listing
DELETE /api/marketplace/listings/:id - Delete listing
POST /api/marketplace/listing/:id/interest - Express interest
GET  /api/marketplace/my-listings    - User's listings
```

---

### 2.7 REZ CRISIS LAYER

**Position:** Emergency infrastructure for the city

#### Crisis Features

| Feature | Description |
|---------|-------------|
| **Emergency Map** | Real-time incidents, safe zones |
| **SOS Broadcast** | Alert all nearby contacts |
| **Shelter Finder** | Nearby shelters with capacity |
| **Resource Finder** | Medicine, oxygen, food, plasma |
| **Blood Network** | Blood donation requests |
| **Volunteer Hub** | Connect helpers with affected |
| **Status Updates** | Family check-in system |
| **Verified Sources** | Only official crisis info |

#### Emergency Map Layers

| Layer | Icon | Description |
|-------|------|-------------|
| Active Incidents | 🔴 | Current emergencies |
| Safe Zones | 🟢 | Verified safe areas |
| Shelters | 🏠 | Temporary shelters |
| Hospitals | 🏥 | Open hospitals |
| Help Centers | 🤝 | Relief centers |
| Volunteer Hubs | 💪 | Volunteer gathering |

#### Resource Categories

| Category | Examples |
|----------|----------|
| Medicine | Medicines, oxygen, ICU beds |
| Food | Meals, water, essentials |
| Shelter | Temporary housing, hotels |
| Transport | Ambulances, relief vehicles |
| Information | Updates, helplines |
| Volunteers | Available helpers |

#### Crisis Flow

```
Alert Received → Assess Severity → Broadcast to Affected Area
                                       │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
       ┌──────────┐             ┌──────────┐             ┌──────────┐
       │ Emergency│             │ Moderate │             │ Low      │
       │ Alerts   │             │ Alerts   │             │ Alerts   │
       └──────────┘             └──────────┘             └──────────┘
```

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Crisis Center | `app/crisis/index.tsx` | Emergency dashboard |
| Crisis Map | `app/crisis/map.tsx` | Emergency map |
| SOS | `app/crisis/sos.tsx` | SOS settings |
| Resources | `app/crisis/resources.tsx` | Find help |
| Volunteer | `app/crisis/volunteer.tsx` | Offer help |
| Family Check | `app/crisis/checkin.tsx` | Status updates |

#### API Endpoints

```
POST /api/crisis/sos              - Trigger SOS
GET  /api/crisis/incidents        - Active incidents
GET  /api/crisis/shelters         - Nearby shelters
GET  /api/crisis/resources        - Available resources
POST /api/crisis/volunteer        - Register as volunteer
GET  /api/crisis/volunteers       - Find volunteers
POST /api/crisis/checkin          - Family check-in
```

---

### 2.8 REAL-TIME DENSITY ENGINE

**Position:** Live crowd intelligence

#### Density Signals

| Signal | Source | Weight |
|--------|--------|--------|
| Check-ins | buzzlocal-vibe-service | 30% |
| Active sessions | buzzlocal-realtime-service | 25% |
| Post activity | buzzlocal-feed-service | 15% |
| Event attendance | z-events-service | 15% |
| Payment activity | merchant-intelligence | 10% |
| Movement velocity | location-intelligence | 5% |

#### Density Algorithm

```
Crowd Score = Σ(Signal × Weight) × Time Decay × Anomaly Factor

Time Decay = exp(-λ × minutes_since_activity)
Anomaly Factor = 1.0 + spike_detection_multiplier
```

#### Heatmap Generation

| Level | Score | Color | Label |
|-------|-------|-------|-------|
| 1 | 0-20 | 🟢 Green | Quiet |
| 2 | 21-40 | 🟡 Yellow | Light |
| 3 | 41-60 | 🟠 Orange | Moderate |
| 4 | 61-80 | 🔴 Red | Busy |
| 5 | 81-100 | ⚫ Black | Packed |

#### Density Features

| Feature | Description |
|---------|-------------|
| **Live Heatmap** | Real-time crowd density |
| **Trend Prediction** | Where crowd is moving |
| **Peak Hours** | Historical busy times |
| **Crowd Flow** | Movement between areas |
| **Anomaly Detection** | Sudden crowd changes |
| **Forecast** | Predict future density |

#### Movement Analysis

| Pattern | Description |
|---------|-------------|
| **Velocity** | Speed of crowd movement |
| **Direction** | Where people are going |
| **Origin** | Where people are coming from |
| **Dwell Time** | How long people stay |
| **Transit** | Movement through area |

#### API Endpoints

```
GET  /api/density/heatmap         - Get density heatmap
GET  /api/density/area/:id        - Get area density
GET  /api/density/prediction/:id  - Get density forecast
GET  /api/density/trends          - Get movement trends
POST /api/density/checkin         - Record check-in
GET  /api/density/peak/:area      - Get peak hours
```

---

### 2.9 MERCHANT LIVE OFFERS

**Position:** Real-time deal discovery

#### Offer Types

| Type | Description | Example |
|------|-------------|---------|
| Flash Sale | Limited time offer | "20% off next 2 hours" |
| Happy Hour | Time-based | "Buy 1 get 1 free 4-7 PM" |
| Live Crowd | Based on density | "Less crowded, visit now" |
| Location Trigger | Near merchant | "100m away - 10% off" |
| Event Link | Related event | "Concert special at café nearby" |
| Creator Boost | Influencer promoted | "Recommended by local foodie" |

#### Merchant Actions

| Action | Description | Cost |
|--------|-------------|------|
| Boost Post | Increase visibility | REZ Coins |
| Flash Discount | Limited time offer | Free (engagement) |
| Happy Hour | Time-based deal | Free |
| Creator Collab | Partner with local creator | Negotiable |
| Crowd Deal | Density-triggered | Free |
| Sponsored Pin | Map pin boost | REZ Coins |

#### Offer Display

```
┌─────────────────────────────────────┐
│ 🏪 Starbucks Koramangala            │
│ 📍 200m away │ ⭐ 4.5 (234)        │
├─────────────────────────────────────┤
│ 🎉 HAPPY HOUR NOW!                  │
│ Buy 1 Get 1 Free                   │
│ 4 PM - 7 PM Today                  │
│ ─────────────────────────────────── │
│ 👥 Currently: 🟢 Quiet (5 min wait) │
│ ─────────────────────────────────── │
│      [Get Directions] [Order Now]   │
└─────────────────────────────────────┘
```

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Offers | `app/(main)/offers.tsx` | Nearby deals |
| Offer Detail | `app/offers/[id].tsx` | Offer details |
| Merchant Profile | `app/merchant/[id].tsx` | Merchant info |
| Create Offer | `app/merchant/create-offer.tsx` | Create deal |

#### API Endpoints

```
GET  /api/offers/nearby            - Get nearby offers
GET  /api/offers/:id               - Get offer details
POST /api/offers                   - Create offer (merchant)
PUT  /api/offers/:id               - Update offer
DELETE /api/offers/:id             - Delete offer
POST /api/offers/:id/redeem       - Redeem offer
GET  /api/offers/merchant/:id      - Merchant's offers
```

---

### 2.10 LOCAL SERVICES DIRECTORY

**Position:** Trusted hyperlocal service providers

#### Service Categories

| Category | Examples |
|----------|----------|
| Home Services | Plumber, electrician, carpenter, painter |
| Beauty | Salon, spa, makeup artist |
| Health | Physiotherapist, nutritionist, therapist |
| Fitness | Personal trainer, yoga, gym |
| Education | Tutor, coaching, classes |
| Pets | Vet, groomer, trainer |
| Events | Photographer, decorator, caterer |
| Professional | CA, lawyer, freelancer |

#### Service Provider Profile

| Field | Description |
|-------|-------------|
| Name | Business/personal name |
| Category | Service type |
| Areas | Serviceable neighborhoods |
| Rating | Average rating |
| Reviews | Recent reviews |
| Trust Score | REZ trust verification |
| Pricing | Price range |
| Availability | Hours, booking required |
| Portfolio | Work samples |
| Verified | Verification badges |

#### Features

| Feature | Description |
|---------|-------------|
| **Nearby Search** | Find services near you |
| **Availability** | Real-time availability |
| **Verified Badges** | Trust indicators |
| **REZ Booking** | Book via app |
| **Direct Call** | One-tap calling |
| **Reviews** | Community reviews |
| **REZ Coins** | Pay with coins |

#### Screens

| Screen | File | Description |
|--------|------|-------------|
| Services | `app/(main)/services.tsx` | Browse services |
| Service Detail | `app/services/[id].tsx` | Provider profile |
| Book Service | `app/services/book/[id].tsx` | Booking flow |
| My Bookings | `app/services/bookings.tsx` | Past bookings |

#### API Endpoints

```
GET  /api/services/categories      - List categories
GET  /api/services/providers     - Browse providers
GET  /api/services/providers/:id - Provider details
POST /api/services/book          - Book service
GET  /api/services/bookings      - User bookings
POST /api/services/review        - Leave review
```

---

## 3. Mobile App Screens

### 3.1 Navigation Architecture

```
App
├── _layout.tsx (providers, auth gate)
│
├── (auth)
│   └── onboarding/
│       ├── index.tsx
│       ├── interests.tsx
│       ├── location.tsx
│       └── connect-account.tsx
│
└── (main)
    └── Bottom Tab Navigation (4 tabs)

    ┌─────────────────────────────────────────────┐
    │  Discover  │    Ask    │ Community │ Safe  │
    │    🏠      │    🤖     │    👥     │  🛡️  │
    └─────────────────────────────────────────────┘

    ├── Discover
    │   ├── index.tsx (Home Feed)
    │   ├── explore.tsx
    │   ├── vibe-map.tsx
    │   ├── events.tsx
    │   ├── event/[id].tsx
    │   ├── places.tsx
    │   ├── place/[id].tsx
    │   └── search.tsx
    │
    ├── Ask
    │   ├── index.tsx (Ask Home)
    │   ├── [id].tsx (Results)
    │   ├── chat/[id].tsx (Conversation)
    │   └── history.tsx
    │
    ├── Community
    │   ├── index.tsx (Societies + Groups)
    │   ├── society/[id]/
    │   │   ├── index.tsx
    │   │   ├── feed.tsx
    │   │   ├── members.tsx
    │   │   ├── facilities.tsx
    │   │   └── marketplace.tsx
    │   ├── group/[id].tsx
    │   ├── create-society.tsx
    │   └── create-group.tsx
    │
    ├── Safe
    │   ├── index.tsx (Safety Center)
    │   ├── map.tsx (Safety Map)
    │   ├── alerts.tsx
    │   ├── alert/[id].tsx
    │   ├── report.tsx
    │   ├── sos.tsx
    │   ├── circle.tsx
    │   └── crisis/ (Crisis Mode)
    │
    ├── [Floating]
    │   ├── create.tsx (Create Post)
    │   └── create-event.tsx
    │
    ├── Marketplace
    │   ├── index.tsx
    │   ├── [id].tsx
    │   ├── create.tsx
    │   └── chat/[id].tsx
    │
    ├── Services
    │   ├── index.tsx
    │   ├── [id].tsx
    │   ├── book/[id].tsx
    │   └── bookings.tsx
    │
    ├── Offers
    │   ├── index.tsx
    │   └── [id].tsx
    │
    ├── Notifications
    │   └── index.tsx
    │
    ├── Wallet
    │   └── index.tsx
    │
    ├── Profile
    │   ├── index.tsx
    │   ├── trust.tsx
    │   ├── settings.tsx
    │   └── creator.tsx
    │
    └── Search
        └── index.tsx
```

### 3.2 Screen Details

| Screen | Layer | Description |
|--------|-------|-------------|
| Home Feed | Discover | AI cards, posts, alerts, offers |
| Vibe Map | Discover | Crowd heatmap, real-time density |
| Explore | Discover | Search, categories, trending |
| Events | Discover | Event discovery, RSVP |
| Ask Home | Ask | Query input, recent queries |
| Ask Results | Ask | AI answer, sources, follow-ups |
| Society Home | Community | Apartment dashboard |
| Group Home | Community | Interest/neighborhood groups |
| Safety Center | Safe | Safety dashboard, quick actions |
| Safety Map | Safe | Safety heatmap overlay |
| Public Alerts | Safe | Agency + community alerts |
| Crisis Center | Safe | Emergency resources |
| Marketplace | Commerce | Local buy/sell |
| Services | Commerce | Local services directory |
| Offers | Commerce | Live merchant deals |
| Profile | Profile | User profile, trust score |
| Wallet | Profile | REZ Coins, transactions |

---

## 4. Backend Services

### 4.1 Existing Services to Extend

| Service | Port | Extend For |
|---------|------|------------|
| buzzlocal-feed-service | 4000 | Marketplace posts, safety alerts |
| buzzlocal-vibe-service | 4003 | Density engine, safety map |
| buzzlocal-community-service | 4004 | Society OS, neighborhoods |
| buzzlocal-intelligence-service | 4010 | Ask Buzz AI, recommendations |
| buzzlocal-notification-service | 4011 | Agency alerts, safety SOS |
| buzzlocal-weather-service | 4014 | Crisis weather alerts |

### 4.2 New Services to Create

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-ask-service | 4015 | Ask Buzz Q&A, AI routing |
| buzzlocal-trust-service | 4016 | Trust scores, verification |
| buzzlocal-safety-service | 4017 | Safety alerts, credibility |
| buzzlocal-agency-service | 4018 | Public agency integration |
| buzzlocal-marketplace-service | 4019 | Buy/sell, listings |
| buzzlocal-crisis-service | 4020 | Emergency mode, SOS |
| buzzlocal-density-service | 4021 | Real-time density engine |
| buzzlocal-merchant-service | 4022 | Live offers, boost |

### 4.3 REZ Services to Use

| Service | Port | Use For |
|---------|------|---------|
| rez-auth-service | 4002 | Verification, address |
| rez-wallet-service | 4004 | Coins, transactions |
| rez-gamification-service | 4041 | Badges, leaderboards |
| rez-notifications-service | 4011 | Push notifications |
| rez-search-service | 4008 | Local search |
| rez-booking-service | 4020 | Service bookings |
| rez-intent-predictor | 4018 | Ask Buzz AI |
| unified-profile | 4120 | Trust calculation |
| location-intelligence | 4115 | Neighborhood clustering |
| merchant-intelligence | 4122 | Services ranking |
| health-expert | 3011 | Emergency resources |
| REZ-care-service | 4055 | Crisis management |

---

## 5. Data Models

### 5.1 Trust & Reputation

```typescript
interface TrustProfile {
  userId: string;
  score: number;
  level: 'new' | 'verified' | 'trusted' | 'expert' | 'guardian' | 'legend';
  verification: {
    phone: boolean;
    email: boolean;
    address: boolean;
    society: boolean;
    id: boolean;
    merchant: boolean;
  };
  badges: Badge[];
  stats: {
    posts: number;
    answers: number;
    helpfulAnswers: number;
    followers: number;
    alerts: number;
    verifiedAlerts: number;
  };
  updatedAt: Date;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: Date;
  area?: string;
}
```

### 5.2 Safety

```typescript
interface SafetyAlert {
  id: string;
  type: 'suspicious' | 'road' | 'crime' | 'hazard' | 'traffic' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
  };
  description: string;
  evidence?: string[];
  credibility: number;
  status: 'active' | 'verified' | 'resolved' | 'false';
  author: {
    userId: string;
    trustLevel: string;
  };
  reports: SafetyReport[];
  createdAt: Date;
  expiresAt: Date;
}

interface SafetyReport {
  userId: string;
  vote: 'confirm' | 'dispute';
  comment?: string;
  timestamp: Date;
}
```

### 5.3 Society

```typescript
interface Society {
  id: string;
  name: string;
  type: 'apartment' | 'gated' | 'layout' | 'campus';
  address: {
    street: string;
    area: string;
    city: string;
    pincode: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  adminIds: string[];
  memberCount: number;
  facilities: Facility[];
  createdAt: Date;
}

interface SocietyMember {
  userId: string;
  role: 'resident' | 'secretary' | 'admin' | 'security';
  flat?: string;
  joinedAt: Date;
}

interface Announcement {
  id: string;
  societyId: string;
  authorId: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  attachments?: string[];
  createdAt: Date;
}
```

### 5.4 Marketplace

```typescript
interface Listing {
  id: string;
  sellerId: string;
  sellerTrust: number;
  category: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: string[];
  location: {
    lat: number;
    lng: number;
    area: string;
    showExact: boolean;
  };
  status: 'active' | 'sold' | 'reserved';
  interestCount: number;
  createdAt: Date;
  expiresAt: Date;
}
```

### 5.5 Crisis

```typescript
interface CrisisIncident {
  id: string;
  type: 'flood' | 'fire' | 'earthquake' | 'storm' | 'other';
  severity: 'moderate' | 'severe' | 'critical';
  location: {
    lat: number;
    lng: number;
    affectedArea: string;
  };
  description: string;
  sources: string[];
  shelter?: Shelter[];
  resources: Resource[];
  updates: CrisisUpdate[];
  createdAt: Date;
  resolvedAt?: Date;
}

interface Shelter {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  capacity: number;
  currentOccupancy: number;
  contact: string;
}

interface CrisisSOS {
  userId: string;
  location: { lat: number; lng: number };
  contacts: string[];
  triggeredAt: Date;
  status: 'active' | 'responded' | 'resolved';
}
```

---

## 6. Coin Economy

### 6.1 Earning Coins

| Action | Coins | Limit |
|--------|-------|-------|
| Post (general) | 20 | - |
| Post (event) | 50 | - |
| Post (alert - verified) | 40 | - |
| Post (place) | 30 | - |
| Answer question | 15 | - |
| Answer marked helpful | 25 | - |
| Verified answer | +10 bonus | - |
| Safety alert (verified) | 30 | - |
| Trusted answerer badge | 50 | - |
| Sale completed (buyer pays) | 5% fee in coins | - |
| Crisis volunteer | 100 | per incident |

### 6.2 Spending Coins

| Action | Coins | Purpose |
|--------|-------|---------|
| Boost post visibility | 50 | 1 hour boost |
| Featured answer slot | 100 | 1 day |
| Society admin badge | 200 | Permanent |
| Emergency SOS broadcast | 0 | Free |
| Marketplace listing | 0 | Free |

---

## 7. Integration Summary

### 7.1 RABTUL Services (Use)

| Service | Features Powered |
|---------|-----------------|
| Auth | Address verification, neighborhood auth |
| Wallet | Marketplace transactions, coins |
| Gamification | Trust badges, leaderboards |
| Notifications | Safety alerts, agency updates |
| Search | Local services search |
| Booking | Service appointments |

### 7.2 REZ Intelligence (Use)

| Service | Features Powered |
|---------|-----------------|
| Intent Predictor | Ask Buzz AI |
| Expert Services | Domain answers |
| Location Intelligence | Neighborhood clustering |
| Unified Profile | Trust calculation |
| Merchant Intelligence | Services ranking |
| Autonomous Agents | AI moderation |

### 7.3 BuzzLocal Services (Extend)

| Service | New Features |
|---------|--------------|
| Feed | Marketplace, safety posts |
| Vibe | Density engine, safety map |
| Community | Society OS |
| Intelligence | Ask Buzz |
| Notification | Agency alerts |
| Realtime | Crisis updates |

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Ask Buzz - AI Q&A engine
- [ ] Trust score system
- [ ] Neighborhood verification
- [ ] Public agency webhooks

### Phase 2: Safety (Week 2-3)

- [ ] REZ Safe center
- [ ] Safety alerts
- [ ] Alert credibility AI
- [ ] Trusted circle
- [ ] SOS flow

### Phase 3: Community (Week 3-4)

- [ ] Society OS core
- [ ] Announcements
- [ ] Facility booking
- [ ] Members directory

### Phase 4: Commerce (Week 4-6)

- [ ] Local marketplace
- [ ] Service directory
- [ ] Live offers
- [ ] Merchant actions

### Phase 5: Crisis (Week 6-8)

- [ ] Crisis mode
- [ ] SOS system
- [ ] Resource finder
- [ ] Volunteer network

### Phase 6: Intelligence (Week 8-10)

- [ ] Density engine
- [ ] Trend prediction
- [ ] Movement analysis
- [ ] Urban intelligence

---

## 9. Success Metrics

### Engagement

| Metric | Target |
|--------|--------|
| Ask Buzz queries/day | 10,000+ |
| Safety alerts verified | >80% |
| Society retention | >90% |
| Marketplace transactions | 1,000+/day |

### Trust

| Metric | Target |
|--------|--------|
| Verified users | >70% |
| Average trust score | >100 |
| Trusted answers | >50% |
| False alert rate | <5% |

### Network Effects

| Metric | Target |
|--------|--------|
| Societies joined | 10,000+ |
| Service providers | 5,000+ |
| Active merchants | 2,000+ |
| Crisis volunteers | 1,000+ |

---

## 10. Documents

| Document | Location |
|----------|----------|
| App Spec | `SPEC.md` |
| City OS Spec | `CITY-OS-SPEC.md` |
| Services | `buzzlocal-services/README.md` |
| REZ Integration | `buzzlocal-services/BUZZLOCAL-REZ-INTEGRATION.md` |
| SOT | `../../SOT.md` |
| Master Audit | `../../ECOSYSTEM-AUDIT-MASTER.md` |

---

**Status:** Phase 1 Planning Complete
**Last Updated:** 2026-05-19
