# BuzzLocal Community Service

Community management service for BuzzLocal social platform.

## Features

- Community CRUD operations
- Member management (join, leave, ban, unban)
- Roles and permissions (admin, moderator, member)
- Activity tracking and logging
- Private community support
- Member limit enforcement (5000 max)

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

```env
PORT=4004
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/buzzlocal-community
REDIS_HOST=localhost
REDIS_PORT=6379
MAX_COMMUNITY_MEMBERS=5000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/communities | Create community |
| GET | /api/communities | List communities |
| GET | /api/communities/:id | Get community |
| PATCH | /api/communities/:id | Update community |
| DELETE | /api/communities/:id | Delete community |
| POST | /api/communities/:id/members | Add member |
| GET | /api/communities/:id/members | Get members |
| DELETE | /api/communities/:id/members/:userId | Remove member |
| GET | /api/communities/:id/activities | Get activities |
| GET | /api/communities/users/:userId/communities | Get user communities |
| GET | /health | Health check |

## License

Proprietary - AXOM (A subsidiary of HOJAI-AI)