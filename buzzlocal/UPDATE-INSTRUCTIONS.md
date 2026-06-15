# BuzzLocal Migration - Update Instructions

**Date:** June 5, 2026
**Status:** MIGRATED from REZ-Consumer

---

## Migration Summary

This service was migrated from `/REZ-Consumer/buzzlocal/` to `/Axom/buzzlocal/`.

### Before Migration
- Source: `/Users/rejaulkarim/Documents/ReZ Full App/REZ-Consumer/buzzlocal/`
- Company: REZ-Consumer (incorrect)

### After Migration
- Destination: `/Users/rejaulkarim/Documents/ReZ Full App/Axom/buzzlocal/`
- Company: AXOM (correct)
- Structure:
  - `mobile/` - React Native app (migrated from REZ-Consumer)
  - `backend/` - Backend microservices (existing AXOM services)

---

## How to Sync Changes Between Locations

### If Working on REZ-Consumer/buzzlocal (Legacy)

If you make changes to the source location at REZ-Consumer, sync them to AXOM:

```bash
# Copy specific files
cp /REZ-Consumer/buzzlocal/mobile/package.json /Axom/buzzlocal/mobile/
cp /REZ-Consumer/buzzlocal/mobile/app.json /Axom/buzzlocal/mobile/
cp /REZ-Consumer/buzzlocal/mobile/src/**/*.ts /Axom/buzzlocal/mobile/src/
cp /REZ-Consumer/buzzlocal/mobile/app/**/*.tsx /Axom/buzzlocal/mobile/app/
```

### Recommended: Work Directly in AXOM

For any new development, work directly in `/Axom/buzzlocal/mobile/`:
- This is the canonical location
- REZ-Consumer/buzzlocal is now deprecated

---

## Imports/References to Update in REZ-Consumer

### Files That May Reference buzzlocal

Search for these patterns in REZ-Consumer:

```typescript
// OLD imports to update or remove
import { Something } from '../buzzlocal';
import { Something } from './buzzlocal';
import '@rez/buzzlocal';
```

### Update to AXOM References

```typescript
// NEW imports (if needed)
import { Something } from '@axom/buzzlocal';
// or use direct service URLs
```

---

## Rollback Instructions

If you need to restore from REZ-Consumer:

```bash
# Only if absolutely necessary
cp -r /REZ-Consumer/buzzlocal/mobile/* /Axom/buzzlocal/mobile/
```

---

## Backend Services Location

Backend microservices remain at:
```
/Axom/buzzlocal/backend/
├── buzzlocal-community-service/
├── buzzlocal-feed-service/
├── buzzlocal-intelligence-service/
├── buzzlocal-notification-service/
├── buzzlocal-payment-service/
├── buzzlocal-realtime-service/
├── buzzlocal-vibe-service/
├── buzzlocal-weather-service/
└── z-events-service/
```

---

## Contact

For questions about this migration, refer to:
- `/REZ-Consumer/CROSS-COMPANY-MIGRATION.md`
- `/Axom/CLAUDE.md`
