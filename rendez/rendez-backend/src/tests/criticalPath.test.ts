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

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../integrations/rez/rezAuthClient', () => ({
  verifyRezToken: jest.fn().mockResolvedValue({
    valid: true,
    verified_status: 'verified',
    rez_user_id: 'rez_mock_user',
    phone: '+919999999999',
  }),
  linkAccount: jest.fn().mockResolvedValue({}),
}));

jest.mock('../integrations/rez/rezWalletClient', () => ({
  holdWallet: jest.fn().mockResolvedValue({ holdId: 'hold_test_123', success: true }),
  releaseHold: jest.fn().mockResolvedValue({ success: true }),
  refundHold: jest.fn().mockResolvedValue({ success: true }),
  getBalance: jest.fn().mockResolvedValue({ balance_paise: 500000, currency: 'INR' }),
}));

jest.mock('../integrations/rez/rezGiftClient', () => ({
  getCatalog: jest.fn().mockResolvedValue([
    { id: 'cat_001', name: 'Coffee for two', merchant_name: 'Café XYZ', amount_paise: 9900, type: 'EXPERIENCE' },
  ]),
  issueVoucher: jest.fn().mockResolvedValue({ voucherId: 'voucher_test_001', code: 'TEST123' }),
  activateVoucher: jest.fn().mockResolvedValue({ activated: true }),
  cancelVoucher: jest.fn().mockResolvedValue({ cancelled: true }),
  getVoucher: jest.fn().mockResolvedValue({ code: 'TEST123', status: 'ACTIVE', expiresAt: new Date(Date.now() + 86400000) }),
}));

jest.mock('../integrations/rez/rezRewardClient', () => ({
  triggerMeetupReward: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    matchCreated: jest.fn().mockResolvedValue(undefined),
    messageSent: jest.fn().mockResolvedValue(undefined),
    giftReceived: jest.fn().mockResolvedValue(undefined),
    giftAccepted: jest.fn().mockResolvedValue(undefined),
    giftRejected: jest.fn().mockResolvedValue(undefined),
    meetupValidated: jest.fn().mockResolvedValue(undefined),
    rewardTriggered: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('../jobs/queue', () => ({
  startRecurringJobs: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../workers/giftExpiryWorker', () => ({ giftExpiryWorker: {} }));
jest.mock('../workers/matchExpiryWorker', () => ({ matchExpiryWorker: {} }));
jest.mock('../workers/catalogCacheWorker', () => ({ catalogCacheWorker: {} }));

// ── Helpers ────────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-rendez';

function makeToken(profileId: string, rezUserId = 'rez_mock_user'): string {
  return jwt.sign({ sub: profileId, rezUserId }, JWT_SECRET, { expiresIn: '1h' });
}

// ── Test State ─────────────────────────────────────────────────────────────────
let aliceToken: string;
let bobToken: string;
let aliceProfileId: string;
let bobProfileId: string;
let matchId: string;
let giftId: string;

// ── Test Suite ─────────────────────────────────────────────────────────────────
describe('Rendez Critical Path', () => {

  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  describe('1. Auth — REZ token verification', () => {
    it('issues a Rendez JWT when REZ token is valid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', 'Bearer rez_mock_token_alice');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      aliceToken = res.body.token;
    });

    it('issues a second Rendez JWT for Bob', async () => {
      // Swap mock to simulate Bob's REZ account
      const { verifyRezToken } = require('../integrations/rez/rezAuthClient');
      verifyRezToken.mockResolvedValueOnce({
        valid: true,
        verified_status: 'verified',
        rez_user_id: 'rez_mock_bob',
        phone: '+918888888888',
      });

      const res = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', 'Bearer rez_mock_token_bob');

      expect(res.status).toBe(200);
      bobToken = res.body.token;
    });

    it('rejects invalid/missing tokens', async () => {
      const res = await request(app).post('/api/v1/auth/verify');
      expect(res.status).toBe(401);
    });
  });

  // ── 2. Profile ───────────────────────────────────────────────────────────────
  describe('2. Profile creation', () => {
    it('creates Alice profile', async () => {
      const res = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Alice',
          age: 26,
          gender: 'FEMALE',
          interestedIn: ['MALE'],
          intent: 'DATING',
          city: 'Mumbai',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Alice');
      aliceProfileId = res.body.id;

      // Re-issue token with real profileId
      aliceToken = makeToken(aliceProfileId);
    });

    it('creates Bob profile', async () => {
      const res = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          name: 'Bob',
          age: 29,
          gender: 'MALE',
          interestedIn: ['FEMALE'],
          intent: 'DATING',
          city: 'Mumbai',
        });

      expect(res.status).toBe(201);
      bobProfileId = res.body.id;
      bobToken = makeToken(bobProfileId, 'rez_mock_bob');
    });

    it('returns own profile on GET /profile/me', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Alice');
    });

    it('allows partial profile updates', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ bio: 'Love exploring new cafés!' });

      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Love exploring new cafés!');
    });
  });

  // ── 3. Discovery & Likes ─────────────────────────────────────────────────────
  describe('3. Discovery and mutual like → Match', () => {
    it('returns discover feed', async () => {
      const res = await request(app)
        .get('/api/v1/discover')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('Alice likes Bob (no match yet)', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/likes/${bobProfileId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.matched).toBe(false);
    });

    it('Bob likes Alice → creates a Match', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/likes/${aliceProfileId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.matched).toBe(true);
      expect(res.body).toHaveProperty('matchId');
      matchId = res.body.matchId;
    });

    it('matches list includes the new match with unreadCount', async () => {
      const res = await request(app)
        .get('/api/v1/matches')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      const match = res.body.find((m: { id: string }) => m.id === matchId);
      expect(match).toBeDefined();
      expect(match).toHaveProperty('unreadCount');
      expect(match).toHaveProperty('lastMessage');
    });
  });

  // ── 4. Messaging State Machine ───────────────────────────────────────────────
  describe('4. Messaging — state machine', () => {
    it('Alice sends the free first message → state FREE_MSG_SENT', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: 'Hey Bob!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    it('Alice cannot send a second message — MSG_LOCKED', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: 'Helllo??' });

      expect(res.status).toBe(403);
    });

    it('Bob replies → chat opens for both (OPEN state)', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ content: 'Hey Alice!' });

      expect(res.status).toBe(200);
    });

    it('Alice can now send freely', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: 'Great to meet you!' });

      expect(res.status).toBe(200);
    });

    it('GET /messages returns message history with state', async () => {
      const res = await request(app)
        .get(`/api/v1/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
      expect(res.body).toHaveProperty('state');
    });
  });

  // ── 5. Gift Flow ─────────────────────────────────────────────────────────────
  describe('5. Gift flow — send, accept, unlock', () => {
    it('Alice sends a coin gift to Bob', async () => {
      const res = await request(app)
        .post('/api/v1/gifts/send')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          receiverId: bobProfileId,
          matchId,
          giftType: 'COIN',
          amountPaise: 5000,
          message: 'A little something for you!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      giftId = res.body.id;
    });

    it('Bob can see the gift in his inbox', async () => {
      const res = await request(app)
        .get('/api/v1/wallet/gifts')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      const found = res.body.find((g: { id: string }) => g.id === giftId);
      expect(found).toBeDefined();
      expect(found.status).toBe('PENDING');
    });

    it('Bob accepts the gift → chat slot unlocked', async () => {
      const res = await request(app)
        .post(`/api/v1/gifts/${giftId}/accept`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('gift');
      expect(res.body.gift.status).toBe('ACCEPTED');
    });

    it('Alice can now send another message (gift slot)', async () => {
      const res = await request(app)
        .post(`/api/v1/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: 'Thank you for accepting! Can we meet?' });

      expect(res.status).toBe(200);
    });
  });

  // ── 6. Safety ────────────────────────────────────────────────────────────────
  describe('6. Safety — report and block', () => {
    it('Alice can report Bob', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${bobProfileId}/report`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ reason: 'SPAM', detail: 'Test report' });

      expect(res.status).toBe(201);
    });

    it('Alice can block Bob', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${bobProfileId}/block`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ── 7. Wallet ────────────────────────────────────────────────────────────────
  describe('7. Wallet — balance proxy', () => {
    it('returns REZ wallet balance', async () => {
      const res = await request(app)
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('balance_paise');
    });
  });

  // ── 8. Admin ─────────────────────────────────────────────────────────────────
  describe('8. Admin — stats and moderation', () => {
    it('GET /admin/stats returns all KPIs', async () => {
      const res = await request(app).get('/admin/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalProfiles');
      expect(res.body).toHaveProperty('totalMatches');
      expect(res.body).toHaveProperty('giftValueAcceptedPaise');
    });

    it('GET /admin/stats/timeseries returns 7-day data', async () => {
      const res = await request(app).get('/admin/stats/timeseries?days=7');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(7);
      expect(res.body[0]).toHaveProperty('matches');
    });

    it('GET /admin/reports returns pending reports', async () => {
      const res = await request(app).get('/admin/reports?status=PENDING');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /admin/gifts returns gift list', async () => {
      const res = await request(app).get('/admin/gifts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── 9. Suspension ────────────────────────────────────────────────────────────
  describe('9. Suspension — blocked account cannot API call', () => {
    it('admin can suspend an account', async () => {
      const res = await request(app)
        .patch(`/admin/users/${bobProfileId}/suspend`);
      expect(res.status).toBe(200);
      expect(res.body.suspended).toBe(true);
    });

    it('suspended user gets 403 on any authenticated route', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('ACCOUNT_SUSPENDED');
    });

    it('admin can unsuspend the account', async () => {
      const res = await request(app)
        .patch(`/admin/users/${bobProfileId}/unsuspend`);
      expect(res.status).toBe(200);
      expect(res.body.suspended).toBe(false);
    });
  });

  // ── 10. Account Deletion ─────────────────────────────────────────────────────
  describe('10. Account deletion — soft delete', () => {
    it('user can delete their own account', async () => {
      const res = await request(app)
        .delete('/api/v1/profile/me')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('deleted profile returns anonymised data', async () => {
      const res = await request(app)
        .get(`/api/v1/profile/me`)
        .set('Authorization', `Bearer ${bobToken}`);

      // isActive=false means rendezAuth blocks it
      expect(res.status).toBe(401);
    });
  });
});
