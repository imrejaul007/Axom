# BuzzLocal City OS - Technical Specification

**Version:** 2.0.0
**Positioning:** "Live Pulse of Your City" / "City Operating System"
**Last Updated:** 2026-05-19

---

## 1. Concept & Vision

BuzzLocal City OS is **urban intelligence infrastructure** — a real-time operating layer for urban life. It aggregates all local information — events, news, places, offers, alerts, safety, community — in one app.

**Core Philosophy:** Data is the product. Every post, check-in, search, and save trains the AI.

**Positioning Shift:**
- NOT: Social app / Event app / Community app
- BUT: City Operating System

---

## 1.1 City OS - 4 Main Layers

| Layer | Features |
|-------|----------|
| **Discover** | Feed, Vibe Map, Trends, Events |
| **Ask** | Ask Buzz AI, Local Q&A, Recommendations |
| **Community** | Societies, Neighborhoods, Groups |
| **Safe & Utility** | Alerts, Safety, Emergency, Public Updates |

---

## 2. Design Language

### 2.1 Aesthetic Direction
**"Urban Nightlife meets Data Visualization"** — Dark theme with vibrant accent colors representing different data layers (crowds = orange/red, calm = green, commerce = gold).

### 2.2 Color Palette

```
Background Dark:    #0F0F1A   (main bg)
Surface:            #1A1A2E   (cards)
Surface Light:      #252540   (elevated cards)
Surface Elevated:   #2D2D4A   (modals)

Primary:            #6366F1   (Indigo - main actions)
Primary Light:      #818CF8   (hover states)
Primary Dark:       #4F46E5   (pressed states)

Accent Orange:      #F97316   (urgency, alerts, CTA)
Accent Green:       #10B981   (success, verified)
Accent Gold:        #FFD700   (coins, rewards)
Accent Red:         #EF4444   (alerts, errors)

Text Primary:       #FFFFFF
Text Secondary:     #9CA3AF
Text Muted:         #6B7280

Heatmap Low:        #22C55E   (green - low crowd)
Heatmap Medium:     #FACC15   (yellow - medium)
Heatmap High:       #EF4444   (red - high crowd)
```

### 2.3 Typography

```
Font Family: System Default (San Francisco on iOS, Roboto on Android)

Headings:
  H1: 32px, Bold, #FFFFFF
  H2: 24px, SemiBold, #FFFFFF
  H3: 20px, SemiBold, #FFFFFF
  H4: 18px, Medium, #FFFFFF

Body:
  Large: 16px, Regular, #FFFFFF
  Regular: 14px, Regular, #9CA3AF
  Small: 12px, Regular, #6B7280

Labels:
  Badge: 10px, SemiBold, uppercase
  Caption: 11px, Medium, #6B7280
```

### 2.4 Spacing System (8pt Grid)

```
xs:   4px
sm:   8px
md:   16px
lg:   24px
xl:   32px
xxl:  48px
```

### 2.5 Border Radius

```
sm:   8px   (buttons, inputs)
md:   12px  (cards)
lg:   16px  (modals)
xl:   24px  (sheets)
full: 9999px (pills, avatars)
```

### 2.6 Motion Principles

```
Duration Fast:    150ms  (micro-interactions)
Duration Normal:  250ms  (transitions)
Duration Slow:    400ms  (page transitions)

Easing:           ease-out (entering), ease-in (exiting)
Spring:           damping 15, stiffness 150 (bouncy elements)
```

---

## 3. Layout & Structure

### 3.1 Navigation Architecture

```
├── Onboarding Flow (pre-auth)
│   ├── Splash
│   ├── Interest Selection
│   ├── Location Permission
│   └── Connect ReZ Account
│
└── Main App (post-auth)
    └── Bottom Tab Navigation
        ├── Home (Feed)
        ├── Explore
        ├── Vibe Map
        ├── Profile
        └── [Floating Create Button]
```

### 3.2 Screen Hierarchy

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
    ├── _layout.tsx
    ├── index.tsx (Home Feed)
    ├── explore.tsx
    ├── vibe-map.tsx
    ├── profile.tsx
    │
    ├── create/
    │   └── index.tsx (Create Post)
    │
    ├── post/
    │   └── [id].tsx (Post Detail)
    │
    ├── event/
    │   └── [id].tsx (Event Detail)
    │
    ├── merchant/
    │   └── [id].tsx (Merchant Profile)
    │
    ├── creator/
    │   ├── index.tsx (Creator Dashboard)
    │   └── [userId].tsx (Creator Profile)
    │
    ├── community/
    │   └── [id].tsx (Community)
    │
    ├── wallet.tsx
    │
    ├── notifications.tsx
    │
    ├── settings.tsx
    │
    └── search.tsx
```

---

## 4. Features & Interactions

### 4.1 Onboarding Flow

**Screen 1: Splash**
- Logo animation (fade + scale)
- Tagline: "Discover what's happening around you"
- Primary CTA: "Get Started" → Interests screen
- Secondary: "Login" → Auth flow

**Screen 2: Interest Selection**
- Grid of interest chips (2 columns)
- Interests: Food, Nightlife, Tech, Fitness, Gaming, Fashion, Startups, Events, Music, Cars, Sports, Anime, Photography, Travel
- Multi-select, minimum 3 required
- "Continue" button (disabled until 3+ selected)
- Selected state: filled primary color

**Screen 3: Location Permission**
- Illustration explaining location benefits
- "Enable Location" → system permission
- Skip option (limited functionality)
- Rationale shown: nearby content, local alerts, personalized feed

**Screen 4: Connect ReZ Account**
- Show if user already has ReZ account
- "Connect to sync coins and history"
- OAuth flow to RABTUL auth
- If new user: auto-create account

### 4.2 Home Feed

**Feed Types (mixed in single feed):**

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| Post | 📝 | Primary | User-generated content |
| Event | 🎉 | Accent Orange | Event announcements |
| Alert | ⚠️ | Red | Urgent local alerts |
| Offer | 🏷️ | Gold | Merchant deals |
| AI Card | 🤖 | Info Blue | AI-generated insights |

**Post Card Structure:**
```
┌─────────────────────────────────────┐
│ [Avatar] Username • 2h ago • 1.2km  │
│         [Reputation Badge]           │
├─────────────────────────────────────┤
│ [Image/Video if attached]           │
│ [Text content - max 3 lines...]    │
│                                     │
│ #Food #Koramangala                  │
├─────────────────────────────────────┤
│ ❤️ 234  💬 45  🔁 12  📑 89       │
│                    [💰 +25 Coins]  │
└─────────────────────────────────────┘
```

**Interactions:**
- Tap card → Post detail
- Double tap → Like with animation
- Long press → Quick actions menu
- Swipe right → Like
- Swipe left → Save
- Pull to refresh
- Infinite scroll with skeleton loading

**AI Cards:**
- "Koramangala nightlife unusually active 🔴"
- "Rain expected near Whitefield in 30 mins 🌧️"
- "New cafe opened near you ☕"

### 4.3 Explore Screen

**Sections:**
1. Search bar (sticky top)
2. Trending Now (horizontal scroll)
3. Categories (icon grid)
4. Nearby Places (list with distance)
5. Recent Searches

**Search Features:**
- Smart suggestions as you type
- Filter chips: Events, Places, People, Offers
- Voice search (future)
- Recent searches saved
- "Find near me" quick action

**Category Icons:**
```
🍔 Food & Drinks
🎉 Events
🌙 Nightlife
🛍️ Shopping
💪 Fitness
🎮 Gaming
📚 Study Spots
🎨 Arts
```

### 4.4 Vibe Map (Core Differentiator)

**Map Layers (toggleable):**

| Layer | Color Code | Data Source |
|-------|-----------|-------------|
| Crowd Heatmap | Green→Yellow→Red | Check-ins, active users |
| Events | Orange pins | Event posts |
| Food Spots | Red markers | Place posts |
| Nightlife | Purple markers | Nightlife tagged |
| Safety | Blue markers | Alert posts |
| Offers | Gold markers | Merchant offers |

**AI Features:**
- Area Mood: "Chill" / "Busy" / "Party Mode" / "Family Time"
- Best Time: "Peak in 30 mins" / "Perfect time now"
- Friend Activity: "3 friends are nearby"
- Trend Alert: "This area is trending 🔥"

**Interactions:**
- Pinch to zoom
- Tap pin → Preview card
- Long press → Quick post from location
- Double tap → Zoom in centered
- Bottom sheet for detailed view

### 4.5 Create Post Flow

**Post Types:**

| Type | Icon | Fields |
|------|------|--------|
| General | 📝 | Text, media, location, tags |
| Event | 🎉 | Title, date, time, venue, description, ticket link |
| Alert | ⚠️ | Category, location, description, severity |
| Place | 📍 | Name, category, description, photos |
| Deal | 🏷️ | Title, discount %, expiry, terms |
| Poll | 📊 | Question, options (2-4), duration |

**Create Flow:**
1. Select post type
2. Fill required fields
3. Add optional media (max 4 images or 1 video)
4. Add location (required for most types)
5. Add tags (auto-suggested based on content)
6. Preview
7. Post → Earn coins

**Coin Rewards (shown after posting):**
```
General Post:      +20 coins
Event Post:        +50 coins
Alert Post:        +40 coins (if confirmed)
Place Discovery:   +30 coins
Deal Posted:       +25 coins
Poll Created:      +15 coins
Media Attached:    +10 coins bonus
```

### 4.6 Profile & Wallet

**Sections:**
1. Header (avatar, name, reputation badge, bio)
2. Stats (posts, followers, following, coins)
3. Tabs: Posts | Saves | Activity
4. Badges earned (horizontal scroll)
5. Streak counter

**Wallet Tab:**
- Coin balance (large, gold)
- Transaction history
- "How to earn more" suggestions
- Redeem options (offers, gifts)

### 4.7 Gamification System

**Streaks:**
| Streak | Icon | Requirement |
|--------|------|-------------|
| Daily Login | 🔥 | Login 7 days straight |
| Posting | ✍️ | Post 3 days/week |
| Exploring | 🗺️ | Check-in 5 places/week |
| Event Going | 🎉 | Attend 2 events/month |

**Badges:**
| Badge | Requirement | Icon |
|-------|------------|------|
| First Post | Create first post | 🟢 |
| Explorer | Check-in 10 places | 🗺️ |
| Night Owl | Post after 10pm 5 times | 🦉 |
| Event Hunter | Attend 5 events | 🎯 |
| Local Legend | 100+ followers in area | ⭐ |
| Truth Teller | 10 accurate alerts | ✅ |
| Foodie | 20 food reviews | 🍔 |
| Early Bird | First to discover 5 new places | 🐦 |

**Leaderboards:**
- Top Creators (weekly)
- Top Explorers (weekly)
- Most Helpful (weekly)
- Area Leaders (monthly)

### 4.8 Creator System

**Creator Dashboard:**
- Total views
- Engagement rate
- Coin earnings
- Follower growth chart
- Top performing posts

**Creator Features:**
- Live streaming (future)
- Affiliate links in posts
- Creator badge
- Exclusive communities
- Early access to features

**Monetization:**
- Earn coins from engagement
- Merchant collaborations (sponsored posts)
- Affiliate commissions
- Tips from followers

---

## 5. Component Inventory

### 5.1 Buttons

**PrimaryButton**
- Background: Primary (#6366F1)
- Text: White, 16px, SemiBold
- Height: 48px
- BorderRadius: 8px
- States: Default, Pressed (Primary Dark), Disabled (50% opacity), Loading (spinner)

**SecondaryButton**
- Background: Transparent
- Border: 1px Primary
- Text: Primary, 16px, SemiBold
- Same dimensions

**IconButton**
- Size: 44x44px (touch target)
- Icon centered
- Background on press

**FloatingActionButton**
- Size: 56x56px
- Position: bottom-right, 16px margin
- Shadow: lg
- Icon: Plus
- Background: Accent Orange

### 5.2 Cards

**PostCard**
- Background: Surface (#1A1A2E)
- BorderRadius: 12px
- Padding: 16px
- Shadow: sm

**EventCard**
- Same as PostCard
- Additional: Date badge overlay
- Accent border-left (orange)

**MerchantCard**
- Same as PostCard
- Additional: Offer badge
- Gold border-left

### 5.3 Inputs

**TextInput**
- Background: Surface Light (#252540)
- Border: 1px Border (#374151)
- BorderRadius: 8px
- Height: 48px
- Padding: 12px 16px
- Focus: Primary border

**SearchInput**
- Same as TextInput
- Leading search icon
- Trailing clear button

**TagInput**
- Chips in flow layout
- Auto-complete dropdown
- Max 5 tags

### 5.4 Navigation

**BottomTabBar**
- Height: 64px + safe area
- Background: Surface (#1A1A2E)
- BorderTop: 1px Border
- 4 tabs + 1 floating center button

**Tab Items:**
- Home: 🏠
- Explore: 🔍
- Map: 🗺️
- Profile: 👤

### 5.5 Overlays

**BottomSheet**
- Background: Surface Elevated
- BorderRadius: 24px top
- Handle bar indicator
- Drag to dismiss

**Modal**
- Centered
- Background: Surface
- BorderRadius: 16px
- Overlay: 70% black

### 5.6 Feedback

**CoinRewardToast**
- Position: Top center
- Background: Gold gradient
- Icon: Coin + amount
- Auto-dismiss: 3s

**BadgeToast**
- Similar to Coin
- Shows new badge earned

---

## 6. Technical Approach

### 6.1 Tech Stack

```
Framework:     React Native (Expo SDK 53)
Language:      TypeScript
Navigation:     Expo Router (file-based)
State:         Zustand
HTTP Client:   Axios
Storage:       AsyncStorage (local), SecureStore (tokens)
Maps:          react-native-maps
Animations:    react-native-reanimated
Lists:         @shopify/flash-list
Icons:         @expo/vector-icons
```

### 6.2 Project Structure

```
buzzlocal-app/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens
│   ├── (main)/            # Main app screens
│   ├── _layout.tsx        # Root layout
│   └── +error.tsx         # Error boundary
│
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # Base UI (Button, Card, Input)
│   │   ├── feed/         # Feed-specific components
│   │   ├── map/          # Map components
│   │   └── profile/      # Profile components
│   │
│   ├── screens/           # Screen components
│   │
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── feedStore.ts
│   │   ├── locationStore.ts
│   │   ├── gamificationStore.ts
│   │   └── walletStore.ts
│   │
│   ├── services/          # API services
│   │   ├── api.ts        # Axios instance
│   │   ├── auth.ts
│   │   ├── feed.ts
│   │   ├── posts.ts
│   │   ├── events.ts
│   │   ├── wallet.ts
│   │   └── gamification.ts
│   │
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Helpers
│   └── types/            # TypeScript types
│
├── constants/            # Theme, config
├── assets/              # Images, fonts
└── package.json
```

### 6.3 Data Models

```typescript
// User
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  reputationLevel: 'Explorer' | 'Local Guide' | 'Trendsetter' | 'City Influencer';
  coinBalance: number;
  interests: string[];
  createdAt: Date;
}

// Post
interface Post {
  id: string;
  type: 'general' | 'event' | 'alert' | 'place' | 'deal' | 'poll';
  authorId: string;
  author: User;
  content: string;
  media?: Media[];
  location?: Location;
  tags: string[];
  coinReward: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  createdAt: Date;
}

// Event
interface Event {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  location: Location;
  startDate: Date;
  endDate?: Date;
  category: string;
  ticketPrice?: number;
  attendees: number;
  interested: number;
  creator: User;
}

// Community
interface Community {
  id: string;
  name: string;
  type: 'area' | 'interest' | 'apartment' | 'campus';
  description: string;
  coverImage?: string;
  memberCount: number;
  location?: Location;
}

// Gamification
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

interface Streak {
  type: 'login' | 'posting' | 'exploring' | 'events';
  current: number;
  best: number;
  lastActivity: Date;
}

// Vibe Map
interface VibeArea {
  id: string;
  name: string;
  center: Location;
  radius: number; // meters
  mood: 'chill' | 'busy' | 'party' | 'family';
  crowdLevel: 1 | 2 | 3 | 4 | 5;
  trending: boolean;
  activeUsers: number;
}
```

### 6.4 API Integration

**RABTUL Services to Connect:**

| Service | Base URL | Purpose |
|---------|----------|---------|
| Auth | `rez-auth-service` | Login, OTP, tokens |
| Wallet | `rez-wallet-service` | Coin balance, transactions |
| Gamification | `rez-gamification-service` | Badges, streaks |
| Creator | `rez-creator-earnings-service` | Earnings, payouts |
| Profile | `rez-profile-service` | User profiles |
| Search | `rez-search-service` | Local search |
| Notifications | `rez-notifications-service` | Push notifications |

**NEW BuzzLocal Services to Build:**

| Service | Purpose |
|---------|---------|
| `buzzlocal-feed-service` | Posts CRUD, feed ranking, AI cards |
| `buzzlocal-vibe-service` | Map data, mood predictions |
| `buzzlocal-community-service` | Communities, groups |

### 6.5 Data Collection Events

All events sent to `rez-analytics-service` and ReZ Mind:

```typescript
// Location & Movement
'check_in' | 'check_out' | 'location_search' | 'map_view'

// Engagement
'post_view' | 'post_like' | 'post_comment' | 'post_save' | 'post_share'
'event_view' | 'event_rsvp' | 'event_attend'

// Commerce
'offer_view' | 'offer_redeem' | 'coin_earn' | 'coin_spend'

// Social
'user_follow' | 'community_join' | 'mention'

// Content Creation
'post_create' | 'post_edit' | 'alert_create'
```

---

## 7. COMPLETED FEATURES

### Phase 1: Core (MVP) ✅
- [x] Onboarding flow
- [x] Home Feed with post types
- [x] Create post flow
- [x] Basic profile
- [x] Coin system integration
- [x] Connect to RABTUL auth + wallet

### Phase 2: Discovery ✅
- [x] Explore/Search screen
- [x] Vibe Map (Mapbox integration)
- [x] Event discovery
- [x] Place discovery

### Phase 3: Social ✅
- [x] Communities
- [x] QR Check-in
- [x] Notifications

### Phase 4: Gamification ✅
- [x] Badges system
- [x] Streaks
- [x] Leaderboards
- [x] Creator dashboard

### Phase 5: Intelligence ✅
- [x] AI cards in feed
- [x] Vibe Map predictions
- [x] Personalized recommendations
- [x] REZ Mind integration

#### REZ Intelligence Integration

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-intelligence-service | 4010 | AI intelligence bridge |
| REZ-event-platform | 4008 | Event tracking |
| REZ-unified-recommendations | 4090 | Recommendations |
| REZ-taste-profile | 4041 | User preferences |

---

## 8. APP SCREENS

| Screen | File | Description |
|--------|------|-------------|
| Home Feed | `app/(main)/index.tsx` | Feed with AI cards, posts, alerts |
| Explore | `app/(main)/explore.tsx` | Search & discover |
| Events | `app/(main)/events.tsx` | Event discovery |
| Event Detail | `app/event/[id].tsx` | Event details, RSVP, tickets |
| Create Event | `app/create-event.tsx` | Create new event |
| Vibe Map | `app/(main)/vibe-map.tsx` | Real Mapbox map with crowd heatmap |
| Communities | `app/(main)/communities.tsx` | Area/interest groups |
| Community Detail | `app/community/[id].tsx` | Community posts, members |
| Create Community | `app/create-community.tsx` | Create new community |
| QR Check-in | `app/(main)/scan.tsx` | Camera-based check-in |
| Profile | `app/(main)/profile.tsx` | Badges, streaks, stats |
| Creator Dashboard | `app/creator.tsx` | Creator analytics & earnings |
| Wallet | `app/wallet.tsx` | Coins & transactions |
| Notifications | `app/notifications.tsx` | All notifications |
| Create Post | `app/create.tsx` | 6 post types |
| Search | `app/search.tsx` | Global search |

---

## 9. BACKEND SERVICES

### Service List

| Service | Port | Description |
|---------|------|-------------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards, coin rewards |
| buzzlocal-vibe-service | 4003 | Vibe areas, check-ins, crowd heatmap |
| buzzlocal-community-service | 4004 | Communities, group posts |
| z-events-service | 4008 | Events, ticketing, QR check-in |

### Architecture

```
┌─────────────────────────────────────────────────┐
│ BuzzLocal App (React Native) │
└─────────────────────┬───────────────────────────┘
                      │
     ┌────────────────┼────────────────┐
     ▼                ▼                ▼        ▼
┌─────────┐    ┌──────────┐   ┌──────────┐  ┌───────┐
│  Feed   │    │   Vibe   │   │Community │  │Events │
│  4000   │    │   4003   │   │  4004   │  │ 4008  │
└────┬────┘    └────┬─────┘   └────┬─────┘  └───┬───┘
     │                │              │            │
     └────────────────┴──────┬──────┴────────────┘
                              │
                     ┌────────▼────────┐
                     │   ReZ Mind   │
                     │ (AI Training) │
                     └──────────────┘
```

---

## 10. DEPLOYMENT

### Docker Compose

```bash
cd buzzlocal-services
docker compose up -d
```

### Render

```bash
cd buzzlocal-services
render deploy
```

### Scripts

| Script | Purpose |
|--------|---------|
| `deploy.sh` | Deploy all services |
| `start-all.sh` | Start all services locally |
| `status.sh` | Check service status |

---

## 11. Environment Variables

```env
# API Base URLs
API_URL=https://api.rezapp.io
AUTH_URL=https://rez-auth-service.onrender.com
WALLET_URL=https://rez-wallet-service.onrender.com
FEED_URL=http://localhost:4000

# ReZ Mind
MIND_URL=https://rez-mind.onrender.com

# Mapbox (for Vibe Map)
MAPBOX_PUBLIC_TOKEN=

# Sentry (error tracking)
SENTRY_DSN=
```
