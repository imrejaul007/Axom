import { v4 as uuidv4 } from 'uuid';
import { EmotionType, EmotionTypeValue, EmotionalState, EmotionTrend, MoodProfile, isEmotionType } from '../types.js';

/**
 * Maximum number of emotional states to keep per user to prevent unbounded growth.
 */
const MAX_STATES_PER_USER = 10000;

/**
 * Default emotion scores for when emotions are not fully specified.
 * @type {Partial<Record<EmotionTypeValue, number>>}
 */
const DEFAULT_EMOTION_SCORES: Partial<Record<EmotionTypeValue, number>> = {
  [EmotionType.NEUTRAL]: 0.5,
  [EmotionType.CALM]: 0.3,
  [EmotionType.JOY]: 0.1,
};

/**
 * Service for managing emotional state recording, retrieval, and analysis.
 * Uses in-memory storage with automatic eviction when limits are reached.
 */
export class EmotionService {
  /**
   * In-memory storage for emotional states, keyed by user ID.
   * @type {Map<string, EmotionalState[]>}
   */
  private stateStore: Map<string, EmotionalState[]>;

  /**
   * In-memory cache for computed mood profiles, keyed by user ID.
   * @type {Map<string, MoodProfile>}
   */
  private profileCache: Map<string, MoodProfile>;

  /**
   * Create a new EmotionService with fresh in-memory storage.
   */
  constructor() {
    this.stateStore = new Map();
    this.profileCache = new Map();
  }

  /**
   * Record a new emotional state for a user.
   * @param {string} userId - Identifier of the user
   * @param {Record<string, number>} emotions - Map of emotion types to scores (0-1)
   * @param {number} intensity - Overall intensity (1-10)
   * @param {string[]} [triggers=[]] - Factors that triggered this emotional state
   * @param {string} [context=''] - Contextual information
   * @param {string} [source='api'] - Source of the emotion data
   * @returns {Promise<EmotionalState>} The recorded emotional state
   */
  async recordEmotion(
    userId: string,
    emotions: Record<string, number>,
    intensity: number,
    triggers: string[] = [],
    context: string = '',
    source: string = 'api'
  ): Promise<EmotionalState> {
    const mergedEmotions: Record<string, number> = { ...DEFAULT_EMOTION_SCORES, ...emotions };

    const validEmotions: Record<EmotionTypeValue, number> = {} as Record<EmotionTypeValue, number>;
    for (const [emotion, score] of Object.entries(mergedEmotions)) {
      if (isEmotionType(emotion) && typeof score === 'number' && score >= 0 && score <= 1) {
        validEmotions[emotion] = score;
      }
    }

    let primaryEmotion: EmotionTypeValue = EmotionType.NEUTRAL;
    let maxScore = 0;
    for (const [emotion, score] of Object.entries(validEmotions)) {
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion as EmotionTypeValue;
      }
    }

    const confidence = Math.min(maxScore * (intensity / 10), 1);

    const state: EmotionalState = {
      id: uuidv4(),
      userId,
      primaryEmotion,
      emotions: validEmotions,
      intensity: Math.max(1, Math.min(10, intensity)),
      triggers: Array.isArray(triggers) ? triggers : [],
      context: String(context ?? ''),
      confidence,
      source: String(source ?? 'api'),
      timestamp: new Date(),
    };

    const userStates = this.stateStore.get(userId) ?? [];
    userStates.push(state);

    if (userStates.length > MAX_STATES_PER_USER) {
      userStates.splice(0, userStates.length - MAX_STATES_PER_USER);
    }

    this.stateStore.set(userId, userStates);
    this.profileCache.delete(userId);

    return state;
  }

  /**
   * Get the latest emotional state for a user.
   * @param {string} userId - Identifier of the user
   * @returns {Promise<EmotionalState | null>} The most recent emotional state, or null if none exist
   */
  async getLatest(userId: string): Promise<EmotionalState | null> {
    const userStates = this.stateStore.get(userId);
    if (!userStates || userStates.length === 0) {
      return null;
    }
    return userStates[userStates.length - 1]!;
  }

  /**
   * Get emotional state history for a user.
   * @param {string} userId - Identifier of the user
   * @param {number} [limit=50] - Maximum number of records to return (most recent first)
   * @returns {Promise<EmotionalState[]>} Array of emotional states, ordered most recent first
   */
  async getHistory(userId: string, limit: number = 50): Promise<EmotionalState[]> {
    const userStates = this.stateStore.get(userId);
    if (!userStates || userStates.length === 0) {
      return [];
    }
    const sorted = [...userStates].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return sorted.slice(0, limit);
  }

  /**
   * Get all emotional states for a user filtered by a specific emotion type.
   * @param {string} userId - Identifier of the user
   * @param {EmotionTypeValue} emotionType - The emotion type to filter by
   * @returns {Promise<EmotionalState[]>} Array of emotional states with the specified primary emotion
   */
  async getByEmotion(userId: string, emotionType: EmotionTypeValue): Promise<EmotionalState[]> {
    const userStates = this.stateStore.get(userId);
    if (!userStates || userStates.length === 0) {
      return [];
    }
    return userStates.filter((state) => state.primaryEmotion === emotionType);
  }

  /**
   * Compute and return the mood profile for a user.
   * Caches the result and invalidates on new emotion recordings.
   * @param {string} userId - Identifier of the user
   * @returns {Promise<MoodProfile>} The computed mood profile
   */
  async getMoodProfile(userId: string): Promise<MoodProfile> {
    const cached = this.profileCache.get(userId);
    if (cached) {
      return cached;
    }

    const userStates = this.stateStore.get(userId) ?? [];
    const profile = this.computeMoodProfile(userId, userStates);
    this.profileCache.set(userId, profile);
    return profile;
  }

  /**
   * Analyze the trend of a specific emotion for a user over a time window.
   * @param {string} userId - Identifier of the user
   * @param {EmotionTypeValue} emotionType - The emotion to analyze
   * @param {number} [hours=24] - Number of hours to look back
   * @returns {Promise<EmotionTrend>} The emotion trend analysis
   */
  async getTrend(userId: string, emotionType: EmotionTypeValue, hours: number = 24): Promise<EmotionTrend> {
    const userStates = this.stateStore.get(userId) ?? [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const relevant = userStates
      .filter((state) => state.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const dataPoints = relevant.map((state) => ({
      timestamp: state.timestamp,
      value: state.emotions[emotionType] ?? 0,
    }));

    const trend = this.computeTrendDirection(dataPoints);

    return {
      userId,
      emotion: emotionType,
      trend,
      dataPoints,
      period: `${hours}h`,
    };
  }

  /**
   * Get the most dominant (most frequent) emotion for a user.
   * @param {string} userId - Identifier of the user
   * @returns {Promise<EmotionTypeValue | null>} The dominant emotion, or null if no data
   */
  async getDominantEmotion(userId: string): Promise<EmotionTypeValue | null> {
    const userStates = this.stateStore.get(userId);
    if (!userStates || userStates.length === 0) {
      return null;
    }

    const counts: Record<string, number> = {};
    for (const state of userStates) {
      counts[state.primaryEmotion] = (counts[state.primaryEmotion] ?? 0) + 1;
    }

    let dominant: EmotionTypeValue = EmotionType.NEUTRAL;
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion as EmotionTypeValue;
      }
    }

    return dominant;
  }

  /**
   * Compute a mood profile from a collection of emotional states.
   * @private
   * @param {string} userId - Identifier of the user
   * @param {EmotionalState[]} states - Collection of emotional states
   * @returns {MoodProfile} The computed mood profile
   */
  private computeMoodProfile(userId: string, states: EmotionalState[]): MoodProfile {
    if (states.length === 0) {
      return {
        userId,
        avgMood: 'neutral',
        dominantEmotion: EmotionType.NEUTRAL,
        stability: 0,
        volatility: 0,
        socialSentiment: {} as Record<EmotionTypeValue, number>,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const emotionCounts: Record<string, number> = {};
    const emotionScores: Record<string, number[]> = {};
    const intensityValues: number[] = [];

    for (const state of states) {
      emotionCounts[state.primaryEmotion] = (emotionCounts[state.primaryEmotion] ?? 0) + 1;
      intensityValues.push(state.intensity);

      for (const [emotion, score] of Object.entries(state.emotions)) {
        if (!emotionScores[emotion]) {
          emotionScores[emotion] = [];
        }
        emotionScores[emotion]!.push(score);
      }
    }

    let dominant: EmotionTypeValue = EmotionType.NEUTRAL;
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion as EmotionTypeValue;
      }
    }

    const avgIntensity = intensityValues.reduce((a, b) => a + b, 0) / intensityValues.length;
    const variance =
      intensityValues.reduce((sum, val) => sum + Math.pow(val - avgIntensity, 2), 0) /
      intensityValues.length;
    const stdDev = Math.sqrt(variance);
    const volatility = Math.min(stdDev / 10, 1);
    const stability = 1 - volatility;

    const avgMood = avgIntensity >= 7 ? 'positive' : avgIntensity >= 4 ? 'neutral' : 'negative';

    const socialSentiment: Record<EmotionTypeValue, number> = {} as Record<EmotionTypeValue, number>;
    for (const emotion of Object.values(EmotionType)) {
      const scores = emotionScores[emotion];
      socialSentiment[emotion] = scores && scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    }

    return {
      userId,
      avgMood,
      dominantEmotion: dominant,
      stability,
      volatility,
      socialSentiment,
      createdAt: states[0]!.timestamp,
      updatedAt: states[states.length - 1]!.timestamp,
    };
  }

  /**
   * Compute the trend direction from a series of data points.
   * @private
   * @param {{ timestamp: Date; value: number }[]} dataPoints
   * @returns {'RISING' | 'FALLING' | 'STABLE'} The computed trend direction
   */
  private computeTrendDirection(
    dataPoints: { timestamp: Date; value: number }[]
  ): 'RISING' | 'FALLING' | 'STABLE' {
    if (dataPoints.length < 2) {
      return 'STABLE';
    }

    const recent = dataPoints.slice(-Math.min(dataPoints.length, 10));
    let totalChange = 0;

    for (let i = 1; i < recent.length; i++) {
      totalChange += recent[i]!.value - recent[i - 1]!.value;
    }

    const avgChange = totalChange / (recent.length - 1);
    const threshold = 0.05;

    if (avgChange > threshold) {
      return 'RISING';
    }
    if (avgChange < -threshold) {
      return 'FALLING';
    }
    return 'STABLE';
  }

  /**
   * Clear all in-memory data. Useful for testing.
   */
  clear(): void {
    this.stateStore.clear();
    this.profileCache.clear();
  }

  /**
   * Get the total number of stored emotional states across all users.
   * @returns {number}
   */
  get totalStates(): number {
    let count = 0;
    for (const states of this.stateStore.values()) {
      count += states.length;
    }
    return count;
  }
}