# Rendez - Developer Guide

**Version:** 1.0.0
**Updated:** June 12, 2026
**Status:** ⚠️ PARTIAL - Has Admin + App + Backend

---

## OVERVIEW

Rendez is a social meeting platform for discovering events and group meetups.

## COMPONENTS

| Component | Description | Status |
|-----------|------------|--------|
| rendez-admin | Admin dashboard | ⚠️ Needs review |
| rendez-app | User mobile app | ⚠️ Needs review |
| rendez-backend | Backend API | ⚠️ Needs review |
| services/REZConnector.js | REZ integration | ✅ |

## FEATURES

- Event discovery
- Group meetups
- Social matching
- RSVP management
- Chat between users

## WHAT NEEDS TO BE BUILT

1. **rendez-backend** - Complete API
   - Event management
   - User matching algorithm
   - Chat system

2. **rendez-app** - Mobile app
   - Event listing
   - RSVP flow
   - Chat interface

3. **rendez-admin** - Admin dashboard
   - Event moderation
   - User management

## PORT ALLOCATION

| Service | Port | Description |
|---------|------|-------------|
| rendez-api | 4060 | Backend API |
| rendez-app | 3001 | Mobile app |
| rendez-admin | 4061 | Admin dashboard |

## INTEGRATION

- Uses REZConnector.js for REZ ecosystem integration
- Connects to RABTUL for auth and wallet

---

**Last Updated:** June 12, 2026