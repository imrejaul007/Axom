# Rendez - Social Connecting Platform

**Version:** 1.0.0  
**Last Updated:** June 17, 2026  
**Company:** Axom | **Type:** Relationship OS

---

## Vision

> *"Find people. Meet safely. Build relationships. Do things together."*

Rendez is a **Relationship OS** combining:
- Dating & social matching
- Business networking
- AI-powered compatibility
- Events & meetups
- Commerce & gifting

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         RENDEZ ECOSYSTEM                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  RENDEZ-APP (Consumer)                                           │  │
│  │   - Discover (swipe)                                             │  │
│  │   - Chat (real-time)                                            │  │
│  │   - Plans (meetups)                                             │  │
│  │   - Safety center                                               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  RENDEZ-ADMIN (Dashboard)                                        │  │
│  │   - User management                                              │  │
│  │   - Moderation                                                   │  │
│  │   - Fraud detection                                             │  │
│  │   - Coordinator tools                                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  RENDEZ-BACKEND (API)                                            │  │
│  │   - Matchmaking engine                                          │  │
│  │   - Real-time messaging                                          │  │
│  │   - Payment processing                                          │  │
│  │   - Safety verification                                          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Products in This Repo

| Product | Path | Purpose | Status |
|---------|------|---------|--------|
| **Rendez-App** | rendez-app/ | Consumer mobile app | ✅ Production |
| **Rendez-Admin** | rendez-admin/ | Admin dashboard | ✅ Production |
| **Rendez-Backend** | rendez-backend/ | API server | ✅ Production |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Mobile** | Expo SDK 50 + expo-router 3.4 |
| **Web (Admin)** | Next.js 14 + App Router |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MongoDB + Mongoose |
| **Cache** | Redis |
| **Real-time** | Socket.io |
| **Payments** | REZ Coins + SUTAR Escrow |
| **AI** | HOJAI Genie (Compatibility, Chat, Recommendations) |
| **Auth** | JWT + OTP |
| **Maps** | Google Maps |

---

## Features

### Consumer App (Rendez-App)

| Category | Features |
|---------|---------|
| **Discovery** | Tinder-style swipe, filters, preferences |
| **Matching** | AI compatibility scoring, match notifications |
| **Chat** | Real-time messaging, typing indicators, read receipts |
| **Gifts** | REZ coins catalog, merchant gifts, vouchers |
| **Plans** | Create/join plans, meetup scheduling |
| **Safety** | SOS, ID verification, block/report, screenshot detection |
| **AI** | Compatibility breakdown, chat suggestions, personality analysis |
| **Special** | Couple Mode, Experience Wallet (BRONZE→PLATINUM) |

### Admin Dashboard (Rendez-Admin)

| Category | Features |
|---------|---------|
| **Dashboard** | KPIs, sparkline charts, day range selectors |
| **Users** | Search, suspend/unsuspend |
| **Moderation** | Report queue, resolve/dismiss |
| **Plans** | Plan management, applicant selection |
| **Gifts** | Gift analytics, status breakdown |
| **Meetups** | Validation, checkin tracking |
| **Fraud** | Flagged accounts, pattern detection |
| **Coordinator** | Seed plans for new cities |

---

## API Services (Rendez-App)

### API Methods (15+ service objects)

```typescript
// Auth
authAPI.verify(token)
authAPI.sendOtp(phone)
authAPI.verifyOtp(phone, otp)
authAPI.refreshToken()

// Profile
profileAPI.getProfile()
profileAPI.updateProfile(data)
profileAPI.uploadPhotos(formData)
profileAPI.getProfileDetail(id)

// Discovery
discoverAPI.getDiscoverProfiles()
discoverAPI.passProfile(id)
discoverAPI.likeProfile(id)

// Match
matchAPI.getMatches()
matchAPI.getMatch(matchId)
matchAPI.unmatch(matchId)

// Messaging
messagingAPI.getMessages(matchId)
messagingAPI.sendMessage(matchId, content)
messagingAPI.markRead(matchId, messageId)

// Gifts
giftAPI.getCatalog()
giftAPI.sendGift(data)
giftAPI.getReceivedGifts()
giftAPI.acceptGift(id)
giftAPI.rejectGift(id)
giftAPI.getVoucher(id)

// Meetups
meetupAPI.suggestMerchants(matchId)
meetupAPI.bookMeetup(matchId, merchantId, scheduledAt)
meetupAPI.checkIn(bookingId)

// Plans
planAPI.getPlans()
planAPI.createPlan(data)
planAPI.applyPlan(id, note)
planAPI.selectApplicant(planId, applicantId)
planAPI.confirmAttendance(planId)

// Safety
safetyAPI.getVerificationStatus()
safetyAPI.reportUser(id, reason)
safetyAPI.blockUser(id)
safetyAPI.getBlockedUsers()

// Wallet
walletAPI.getBalance()
walletAPI.getGiftHistory()

// Requests
requestAPI.getMessageRequests()
requestAPI.acceptRequest(id)
requestAPI.declineRequest(id)
```

---

## Backend Services

| Service | Purpose |
|---------|---------|
| Matchmaking Engine | AI compatibility, recommendations |
| Real-time Chat | Socket.io messaging |
| Gift Service | REZ coins, merchant catalog |
| Meetup Service | Plan coordination |
| Safety Service | Verification, SOS |
| Payment Service | SUTAR Escrow integration |

---

## Environment Variables

### Rendez-App

```bash
EXPO_PUBLIC_API_URL=https://rendez-backend.onrender.com
EXPO_PUBLIC_SOCKET_URL=wss://rendez-backend.onrender.com
```

### Rendez-Admin

```bash
NEXT_PUBLIC_API_URL=https://rendez-backend.onrender.com
ADMIN_JWT_SECRET=<generate with openssl rand -hex 32>
```

### Rendez-Backend

```bash
PORT=4201
MONGODB_URI=mongodb+srv://<credentials>@cluster.mongodb.net/rendez
JWT_SECRET=<generate with openssl rand -hex 32>
```

---

## Quick Start

### Backend

```bash
cd rendez-backend
npm install
npm run dev
# Runs on http://localhost:4201
```

### Mobile App

```bash
cd rendez-app
npm install
npx expo start
```

### Admin Dashboard

```bash
cd rendez-admin
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Database Models

| Model | Purpose |
|-------|---------|
| User | Profile, preferences, photos |
| Match | Swipe matches, compatibility |
| Message | Chat messages |
| Gift | Sent/received gifts |
| Meetup | Date plans |
| Plan | Group meetups |
| Verification | ID, selfie, social |
| Report | User reports |
| Block | Blocked users |

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| JWT Auth | Bearer token in Authorization header |
| OTP Verification | Phone number verification |
| ID Verification | Government ID upload |
| Biometric Auth | Face ID / Fingerprint for high-value |
| Screenshot Detection | notifyScreenshot() API |
| Rate Limiting | Per-endpoint limits |
| Input Validation | Zod schemas |

---

## Strategic Positioning

| Product | Role |
|---------|------|
| **Rendez** | Social connecting & dating |
| **BuzzLocal** | Hyperlocal community |
| **Z-Events** | Event discovery |
| **REZ** | Commerce & rewards |

---

## Related Repos

| Repo | Purpose |
|------|---------|
| `companies/hojai-ai/` | Genie AI services |
| `companies/RABTUL-Technologies/` | REZ Wallet, Payments |
| `companies/REZ-Consumer/` | Consumer apps |

---

*Last Updated: June 17, 2026*
*Rendez - Find your people*
