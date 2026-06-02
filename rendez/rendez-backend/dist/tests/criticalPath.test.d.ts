/**
 * Rendez Critical Path — End-to-End Tests
 *
 * Tests the happy path that generates revenue:
 *   Auth → Profile → Like (mutual) → Match → Send message (locked) → Send gift → Accept gift → Unlock chat
 *
 * Uses supertest against the Express app with a real test DB (set TEST_DATABASE_URL).
 * All external calls (REZ Partner API, FCM, Redis, BullMQ) are mocked.
 *
 * Run: npm test
 * Run with coverage: npm test -- --coverage
 */
export {};
//# sourceMappingURL=criticalPath.test.d.ts.map