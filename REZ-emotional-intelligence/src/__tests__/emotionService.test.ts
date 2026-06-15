import { EmotionService } from '../services/emotionService.js';
import { EmotionType, EmotionTypes } from '../types.js';

describe('EmotionService', () => {
  let service: EmotionService;

  /**
   * Create a fresh EmotionService instance before each test.
   */
  beforeEach(() => {
    service = new EmotionService();
  });

  describe('recordEmotion', () => {
    /**
     * @returns {Promise<import('../types.js').EmotionalState>}
     */
    it('should record an emotional state with all required fields', async () => {
      const state = await service.recordEmotion('user-1', {
        [EmotionType.JOY]: 0.8,
        [EmotionType.SADNESS]: 0.1,
        [EmotionType.ANGER]: 0.05,
      }, 7, ['meeting', 'sunny weather'], 'Had a great meeting', 'api');

      expect(state.id).toBeDefined();
      expect(state.userId).toBe('user-1');
      expect(state.primaryEmotion).toBe(EmotionType.JOY);
      expect(state.intensity).toBe(7);
      expect(state.triggers).toEqual(['meeting', 'sunny weather']);
      expect(state.context).toBe('Had a great meeting');
      expect(state.source).toBe('api');
      expect(state.confidence).toBeGreaterThan(0);
      expect(state.confidence).toBeLessThanOrEqual(1);
      expect(state.timestamp).toBeInstanceOf(Date);
    });

    it('should default intensity to 5 when within range', async () => {
      const state = await service.recordEmotion('user-1', {
        [EmotionType.NEUTRAL]: 0.5,
      }, 5);

      expect(state.intensity).toBe(5);
    });

    it('should clamp intensity to valid range (1-10)', async () => {
      const lowState = await service.recordEmotion('user-1', {}, 0);
      expect(lowState.intensity).toBe(1);

      const highState = await service.recordEmotion('user-1', {}, 15);
      expect(highState.intensity).toBe(10);
    });

    it('should determine primary emotion from highest score', async () => {
      const state = await service.recordEmotion('user-1', {
        [EmotionType.JOY]: 0.9,
        [EmotionType.CALM]: 0.6,
        [EmotionType.ANXIETY]: 0.3,
      }, 5);

      expect(state.primaryEmotion).toBe(EmotionType.JOY);
    });

    it('should fill missing emotions with default scores', async () => {
      const state = await service.recordEmotion('user-1', {
        [EmotionType.JOY]: 0.8,
      }, 5);

      expect(state.emotions[EmotionType.NEUTRAL]).toBe(0.5);
      expect(state.emotions[EmotionType.CALM]).toBe(0.3);
    });

    it('should reject invalid emotion types', async () => {
      const state = await service.recordEmotion('user-1', {
        INVALID_EMOTION: 0.5,
        [EmotionType.JOY]: 0.8,
      }, 5);

      const emotionsAny = state.emotions as Record<string, number>;
      expect(emotionsAny['INVALID_EMOTION']).toBeUndefined();
      expect(state.emotions[EmotionType.JOY]).toBe(0.8);
    });
  });

  describe('getLatest', () => {
    it('should return the most recently recorded state', async () => {
      await service.recordEmotion('user-1', { [EmotionType.NEUTRAL]: 0.5 }, 3);
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.9 }, 8);

      const latest = await service.getLatest('user-1');

      expect(latest).not.toBeNull();
      expect(latest!.primaryEmotion).toBe(EmotionType.JOY);
      expect(latest!.intensity).toBe(8);
    });

    it('should return null for user with no records', async () => {
      const result = await service.getLatest('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('should return history ordered most recent first', async () => {
      // Record emotions with slight delays to ensure unique timestamps
      const state1 = await service.recordEmotion('user-1', { [EmotionType.NEUTRAL]: 0.5 }, 3);
      await new Promise((r) => setTimeout(r, 10));
      const state2 = await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.9 }, 8);
      await new Promise((r) => setTimeout(r, 10));
      const state3 = await service.recordEmotion('user-1', { [EmotionType.CALM]: 0.7 }, 5);

      const history = await service.getHistory('user-1');

      expect(history).toHaveLength(3);
      // Most recent first (last recorded)
      expect(history[0]!.id).toBe(state3.id);
      expect(history[1]!.id).toBe(state2.id);
      expect(history[2]!.id).toBe(state1.id);
    });

    it('should respect the limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await service.recordEmotion('user-1', { [EmotionType.NEUTRAL]: 0.5 }, 5);
      }

      const history = await service.getHistory('user-1', 3);

      expect(history).toHaveLength(3);
    });

    it('should return empty array for user with no records', async () => {
      const history = await service.getHistory('nonexistent-user');

      expect(history).toEqual([]);
    });
  });

  describe('getByEmotion', () => {
    it('should filter states by primary emotion type', async () => {
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.9 }, 8);
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.7 }, 6);
      await service.recordEmotion('user-1', { [EmotionType.SADNESS]: 0.8 }, 4);

      const joyStates = await service.getByEmotion('user-1', EmotionType.JOY);

      expect(joyStates).toHaveLength(2);
      joyStates.forEach((state) => {
        expect(state.primaryEmotion).toBe(EmotionType.JOY);
      });
    });

    it('should return empty array when no states match', async () => {
      const states = await service.getByEmotion('user-1', EmotionType.ANGER);

      expect(states).toEqual([]);
    });
  });

  describe('getMoodProfile', () => {
    it('should compute a mood profile with stability and volatility', async () => {
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.9 }, 8);
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.8 }, 7);
      await service.recordEmotion('user-1', { [EmotionType.CALM]: 0.7 }, 5);

      const profile = await service.getMoodProfile('user-1');

      expect(profile.userId).toBe('user-1');
      expect(profile.dominantEmotion).toBe(EmotionType.JOY);
      expect(profile.stability).toBeGreaterThanOrEqual(0);
      expect(profile.stability).toBeLessThanOrEqual(1);
      expect(profile.volatility).toBeGreaterThanOrEqual(0);
      expect(profile.volatility).toBeLessThanOrEqual(1);
      expect(profile.avgMood).toBeDefined();
    });

    it('should handle user with no records', async () => {
      const profile = await service.getMoodProfile('nonexistent-user');

      expect(profile.userId).toBe('nonexistent-user');
      expect(profile.dominantEmotion).toBe(EmotionType.NEUTRAL);
      expect(profile.stability).toBe(0);
      expect(profile.volatility).toBe(0);
    });
  });

  describe('getTrend', () => {
    it('should compute RISING trend when emotion scores increase', async () => {
      const now = Date.now();
      await service.recordEmotion('user-1', { [EmotionType.ANXIETY]: 0.2 }, 3);
      await service.recordEmotion('user-1', { [EmotionType.ANXIETY]: 0.5 }, 5);
      await service.recordEmotion('user-1', { [EmotionType.ANXIETY]: 0.8 }, 8);

      const trend = await service.getTrend('user-1', EmotionType.ANXIETY, 24);

      expect(trend.userId).toBe('user-1');
      expect(trend.emotion).toBe(EmotionType.ANXIETY);
      expect(trend.trend).toBe('RISING');
      expect(trend.dataPoints.length).toBeGreaterThanOrEqual(3);
      expect(trend.period).toBe('24h');
    });

    it('should compute FALLING trend when emotion scores decrease', async () => {
      await service.recordEmotion('user-1', { [EmotionType.ANGER]: 0.9 }, 9);
      await service.recordEmotion('user-1', { [EmotionType.ANGER]: 0.5 }, 5);
      await service.recordEmotion('user-1', { [EmotionType.ANGER]: 0.2 }, 3);

      const trend = await service.getTrend('user-1', EmotionType.ANGER, 24);

      expect(trend.trend).toBe('FALLING');
    });

    it('should return STABLE when scores fluctuate minimally', async () => {
      for (let i = 0; i < 5; i++) {
        await service.recordEmotion('user-1', { [EmotionType.CALM]: 0.5 + (Math.random() * 0.1 - 0.05) }, 5);
      }

      const trend = await service.getTrend('user-1', EmotionType.CALM, 24);

      expect(trend.trend).toBe('STABLE');
    });

    it('should return STABLE with fewer than 2 data points', async () => {
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.5 }, 5);

      const trend = await service.getTrend('user-1', EmotionType.JOY, 24);

      expect(trend.trend).toBe('STABLE');
      expect(trend.dataPoints.length).toBe(1);
    });
  });

  describe('getDominantEmotion', () => {
    it('should return the most frequently recorded emotion', async () => {
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.8 }, 5);
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.7 }, 6);
      await service.recordEmotion('user-1', { [EmotionType.JOY]: 0.9 }, 4);
      await service.recordEmotion('user-1', { [EmotionType.SADNESS]: 0.6 }, 3);

      const dominant = await service.getDominantEmotion('user-1');

      expect(dominant).toBe(EmotionType.JOY);
    });

    it('should return null for user with no records', async () => {
      const dominant = await service.getDominantEmotion('nonexistent-user');

      expect(dominant).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle a large number of records without exceeding storage limits', async () => {
      for (let i = 0; i < 100; i++) {
        await service.recordEmotion('user-1', { [EmotionType.NEUTRAL]: 0.5 }, 5);
      }

      const history = await service.getHistory('user-1', 200);

      expect(history.length).toBeLessThanOrEqual(10000);
    });

    it('should support all defined emotion types', async () => {
      for (const emotion of EmotionTypes) {
        const state = await service.recordEmotion('user-1', {
          [emotion]: 0.9,
        }, 5);

        expect(state.emotions[emotion]).toBe(0.9);
        expect(state.primaryEmotion).toBe(emotion);
      }
    });

    it('should produce correct confidence values', async () => {
      const state1 = await service.recordEmotion('user-1', {
        [EmotionType.JOY]: 0.5,
      }, 5);
      expect(state1.confidence).toBeCloseTo(0.25, 2);

      const state2 = await service.recordEmotion('user-1', {
        [EmotionType.JOY]: 1.0,
      }, 10);
      expect(state2.confidence).toBeCloseTo(1.0, 2);
    });
  });
});
