"use strict";
/**
 * Jest global test setup
 *
 * Sets environment variables required before any module is loaded.
 * Uses SQLite via prisma-client for fast in-memory tests if DATABASE_URL
 * is not explicitly set (for CI). In local dev, point to a real Postgres
 * test database via TEST_DATABASE_URL.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-rendez';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '0'; // random port — avoids conflicts
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/rendez_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
// Silence morgan request logs during tests
process.env.NODE_ENV = 'test';
//# sourceMappingURL=setup.js.map