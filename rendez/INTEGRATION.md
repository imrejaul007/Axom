# RendezOS Integration with BuzzLocal

**Date:** 2026-07-02
**Status:** Existing codebase, integration planned

---

## Current State

Rendez is 90% production-ready at:
- **Backend:** `rendez-backend/` (compiled to `dist/`)
- **Admin:** `rendez-admin/` (Next.js dashboard)
- **App:** `rendez-app/` (Consumer mobile app)
- **Port:** 4000 (configured in `.env`)

### Rendez Features

| Module | Routes | Features |
|--------|--------|----------|
| **Events** | `/api/events` | Create, browse, RSVP, discover |
| **Meetups** | `/api/meetup` | Group meetups, locations |
| **Match** | `/api/match` | Compatibility scoring, AI matching |
| **Messaging** | `/api/messaging` | Real-time chat, video calls |
| **Safety** | `/api/safety` | SOS, background checks |
| **Experience Credits** | `/api/experience-credits` | Gamification |
| **Gift** | `/api/gift` | Virtual gifts |

---

## Integration Points with BuzzLocal

### 1. Shared Authentication
- Rendez and BuzzLocal should share user identity
- Use CorpID (RTMN Foundation) for universal login
- BuzzLocal user → Rendez user mapping

### 2. Event Cross-Posting
- BuzzLocal community events → Rendez events feed
- Rendez meetups → BuzzLocal local discovery
- Shared event calendar

### 3. Society Integration
- BuzzLocal SocietyOS → Rendez activities
- Society members → Rendez neighbor network
- Shared safety alerts

### 4. Trust Score Sharing
- BuzzLocal trust service → Rendez safety
- Rendez verification → BuzzLocal trust
- Unified reputation system

### 5. Shared Feed
- BuzzLocal feed ←→ Rendez activity stream
- Cross-platform content visibility

---

## Port Conflict Resolution

| Service | Port | Status |
|---------|------|--------|
| Rendez backend | 4000 | Conflicts with Feed service |
| Feed service | 4000 | Currently on 4000 |

**Resolution options:**
1. Move Feed service to 4010
2. Move Rendez to 3001
3. Keep Rendez offline until deployment

---

## Next Steps

1. [ ] Resolve port conflict
2. [ ] Wire shared CorpID authentication
3. [ ] Build event bridge between services
4. [ ] Share trust scores
5. [ ] Test end-to-end flow

---

**Status:** Ready for integration once port conflict resolved
