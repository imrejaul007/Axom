# Rendez Admin Dashboard

**Version:** 1.0.0 | **Framework:** Next.js 14 | **Company:** Axom

---

## Overview

Admin dashboard for managing Rendez social connecting platform.

---

## Pages

| Page | Description |
|------|-------------|
| Dashboard | KPIs, sparklines, user stats |
| Users | User management (suspend/unsuspend) |
| Moderation | Content moderation queue |
| Plans | Plans admin & validation |
| Gifts | Gift analytics |
| Meetups | Meetup validation |
| Fraud | Fraud flags |
| Coordinator | Seed plans tool |
| Login | Admin login |

---

## Features

- JWT authentication
- User management
- Content moderation
- Plan verification
- Fraud detection
- Analytics dashboard

---

## Setup

```bash
cd rendez-admin
npm install
npm run dev
```

---

## Environment

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
```
