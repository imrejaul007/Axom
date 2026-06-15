/**
 * Supported emotion types tracked by the emotional intelligence service.
 * @readonly
 * @enum {string}
 */
export const EmotionType = {
  JOY: 'JOY',
  SADNESS: 'SADNESS',
  ANGER: 'ANGER',
  FEAR: 'FEAR',
  SURPRISE: 'SURPRISE',
  DISGUST: 'DISGUST',
  NEUTRAL: 'NEUTRAL',
  EXCITEMENT: 'EXCITEMENT',
  CALM: 'CALM',
  ANXIETY: 'ANXIETY',
  LOVE: 'LOVE',
  FRUSTRATION: 'FRUSTRATION',
} as const;

/**
 * Valid emotion type values.
 * @typedef {typeof EmotionType[keyof typeof EmotionType]} EmotionTypeValue
 */
export type EmotionTypeValue = typeof EmotionType[keyof typeof EmotionType];

/**
 * Represents a recorded emotional state for a user.
 * @typedef {Object} EmotionalState
 * @property {string} id - Unique identifier for this emotional state record
 * @property {string} userId - Identifier of the user
 * @property {EmotionTypeValue} primaryEmotion - The dominant emotion at this moment
 * @property {Record<EmotionTypeValue, number>} emotions - Map of all emotion types to their scores (0-1)
 * @property {number} intensity - Overall intensity of the emotional state (1-10)
 * @property {string[]} triggers - Factors that triggered this emotional state
 * @property {string} context - Contextual information about the situation
 * @property {number} confidence - Confidence level of the analysis (0-1)
 * @property {string} source - Source of the emotion data (e.g., 'api', 'wearable', 'self-report')
 * @property {Date} timestamp - When this emotional state was recorded
 */
export interface EmotionalState {
  id: string;
  userId: string;
  primaryEmotion: EmotionTypeValue;
  emotions: Record<EmotionTypeValue, number>;
  intensity: number;
  triggers: string[];
  context: string;
  confidence: number;
  source: string;
  timestamp: Date;
}

/**
 * Represents a trend analysis for a specific emotion over time.
 * @typedef {Object} EmotionTrend
 * @property {string} userId - Identifier of the user
 * @property {EmotionTypeValue} emotion - The emotion being tracked
 * @property {'RISING' | 'FALLING' | 'STABLE'} trend - The overall trend direction
 * @property {{ timestamp: Date; value: number }[]} dataPoints - Time-series data points
 * @property {string} period - The time period analyzed (e.g., '1h', '6h', '24h', '7d')
 */
export interface EmotionTrend {
  userId: string;
  emotion: EmotionTypeValue;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  dataPoints: { timestamp: Date; value: number }[];
  period: string;
}

/**
 * Represents a comprehensive mood profile for a user.
 * @typedef {Object} MoodProfile
 * @property {string} userId - Identifier of the user
 * @property {string} avgMood - Average mood category
 * @property {EmotionTypeValue} dominantEmotion - The most frequent emotion
 * @property {number} stability - Stability score (0-1, higher means more stable)
 * @property {number} volatility - Volatility score (0-1, higher means more volatile)
 * @property {Record<EmotionTypeValue, number>} socialSentiment - Social sentiment breakdown by emotion
 * @property {Date} createdAt - When the profile was first created
 * @property {Date} updatedAt - When the profile was last updated
 */
export interface MoodProfile {
  userId: string;
  avgMood: string;
  dominantEmotion: EmotionTypeValue;
  stability: number;
  volatility: number;
  socialSentiment: Record<EmotionTypeValue, number>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Valid emotion type values list.
 * @type {EmotionTypeValue[]}
 */
export const EmotionTypes = Object.values(EmotionType);

/**
 * Check if a value is a valid emotion type.
 * @param {string} value
 * @returns {value is EmotionTypeValue}
 */
export function isEmotionType(value: string): value is EmotionTypeValue {
  return EmotionTypes.includes(value as EmotionTypeValue);
}
