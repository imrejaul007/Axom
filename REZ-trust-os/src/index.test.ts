/**
 * REZ Trust OS - Unit Tests
 * @module test
 */

import { TrustScoreService } from './services/trustScoreService.js';
import { IdentityService } from './services/identityService.js';
import { FraudService } from './services/fraudService.js';
import { ReputationService } from './services/reputationService.js';
import { TrustTier, IdentityStatus, KycLevel, FraudRisk, ReputationLevel } from './types.js';

describe('TrustScoreService', () => {
  const userId = 'test-user-trust';

  beforeEach(() => {
    TrustScoreService.initialize(userId);
  });

  describe('initialize', () => {
    it('should create initial trust score', () => {
      const score = TrustScoreService.getScore(userId);
      expect(score).not.toBeNull();
      expect(score?.overall).toBe(50);
      expect(score?.tier).toBe(TrustTier.BASIC);
    });
  });

  describe('calculateScore', () => {
    it('should calculate weighted score', () => {
      const components = {
        identity: 100,
        behavior: 80,
        activity: 60,
        verification: 80,
        history: 60,
      };
      const score = TrustScoreService.calculateScore(components);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getTier', () => {
    it('should return PREMIUM for score >= 90', () => {
      expect(TrustScoreService.getTier(95)).toBe(TrustTier.PREMIUM);
    });

    it('should return TRUSTED for score >= 75', () => {
      expect(TrustScoreService.getTier(80)).toBe(TrustTier.TRUSTED);
    });

    it('should return VERIFIED for score >= 50', () => {
      expect(TrustScoreService.getTier(60)).toBe(TrustTier.VERIFIED);
    });

    it('should return BASIC for score >= 25', () => {
      expect(TrustScoreService.getTier(30)).toBe(TrustTier.BASIC);
    });

    it('should return UNVERIFIED for score < 25', () => {
      expect(TrustScoreService.getTier(20)).toBe(TrustTier.UNVERIFIED);
    });
  });

  describe('updateScore', () => {
    it('should update trust score', () => {
      const score = TrustScoreService.updateScore(userId, { identity: 100 }, 'KYC verified');
      expect(score.components.identity).toBe(100);
      expect(score.overall).toBeGreaterThan(50);
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      const history = TrustScoreService.getHistory(userId);
      expect(history).toHaveLength(0);
    });

    it('should record history after updates', () => {
      TrustScoreService.updateScore(userId, { identity: 100 }, 'KYC verified');
      const history = TrustScoreService.getHistory(userId);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});

describe('IdentityService', () => {
  const userId = 'test-user-identity';

  describe('submitKyc', () => {
    it('should submit KYC data', () => {
      const identity = IdentityService.submitKyc(userId, ['passport', 'aadhaar']);
      expect(identity.status).toBe(IdentityStatus.IN_REVIEW);
      expect(identity.kycLevel).toBe(KycLevel.BASIC);
      expect(identity.documents).toEqual(['passport', 'aadhaar']);
    });
  });

  describe('verify', () => {
    it('should verify identity', () => {
      IdentityService.submitKyc(userId, ['passport']);
      const identity = IdentityService.verify(userId, KycLevel.ENHANCED);
      expect(identity.status).toBe(IdentityStatus.VERIFIED);
      expect(identity.kycLevel).toBe(KycLevel.ENHANCED);
      expect(identity.verifiedAt).toBeDefined();
    });
  });

  describe('reject', () => {
    it('should reject identity', () => {
      IdentityService.submitKyc(userId, ['passport']);
      const identity = IdentityService.reject(userId, 'Documents not clear');
      expect(identity.status).toBe(IdentityStatus.REJECTED);
      expect(identity.kycLevel).toBe(KycLevel.NONE);
    });
  });

  describe('isVerified', () => {
    it('should return false for unverified', () => {
      expect(IdentityService.isVerified(userId)).toBe(false);
    });

    it('should return true for verified', () => {
      IdentityService.submitKyc(userId, ['passport']);
      IdentityService.verify(userId, KycLevel.STANDARD);
      expect(IdentityService.isVerified(userId)).toBe(true);
    });
  });
});

describe('FraudService', () => {
  const userId = 'test-user-fraud';

  describe('check', () => {
    it('should return LOW risk by default', () => {
      const check = FraudService.check(userId);
      expect(check.risk).toBe(FraudRisk.LOW);
      expect(check.flags).toHaveLength(0);
    });

    it('should detect unusual location', () => {
      const check = FraudService.check(userId, { location: 'unknown-city' });
      expect(check.flags).toContain('unusual_location');
    });

    it('should detect suspicious device', () => {
      const check = FraudService.check(userId, { deviceId: 'emulator-123' });
      expect(check.flags).toContain('suspicious_device');
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      const history = FraudService.getHistory(userId);
      expect(history).toHaveLength(0);
    });
  });
});

describe('ReputationService', () => {
  const userId = 'test-user-rep';

  describe('initialize', () => {
    it('should create initial reputation', () => {
      const rep = ReputationService.initialize(userId);
      expect(rep.score).toBe(50);
      expect(rep.reviews).toBe(0);
      expect(rep.level).toBe(ReputationLevel.NEW);
    });
  });

  describe('addReview', () => {
    it('should add review and update rating', () => {
      const rep = ReputationService.addReview(userId, 5);
      expect(rep.reviews).toBe(1);
      expect(rep.avgRating).toBe(5);
    });

    it('should average multiple reviews', () => {
      ReputationService.addReview(userId, 3);
      const rep = ReputationService.addReview(userId, 5);
      expect(rep.reviews).toBe(2);
      expect(rep.avgRating).toBe(4);
    });
  });

  describe('addBadge', () => {
    it('should add badge', () => {
      const rep = ReputationService.addBadge(userId, 'top-contributor');
      expect(rep.badges).toContain('top-contributor');
      expect(rep.score).toBe(55); // +5 for badge
    });

    it('should not duplicate badges', () => {
      ReputationService.addBadge(userId, 'top-contributor');
      const rep = ReputationService.addBadge(userId, 'top-contributor');
      expect(rep.badges.filter((b: string) => b === 'top-contributor').length).toBe(1);
    });
  });

  describe('getLevel', () => {
    it('should return ELITE for score >= 90', () => {
      expect(ReputationService.getLevel(95)).toBe(ReputationLevel.ELITE);
    });

    it('should return NEW for score < 25', () => {
      expect(ReputationService.getLevel(20)).toBe(ReputationLevel.NEW);
    });
  });
});