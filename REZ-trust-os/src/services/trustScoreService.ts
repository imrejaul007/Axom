/**
 * REZ Trust OS - Trust Score Service
 * @module services/trustScoreService
 */

import { v4 as uuidv4 } from 'uuid';
import type { TrustScore, TrustTier, TrustChange } from '../types.js';

// In-memory store (replace with MongoDB in production)
const trustScores = new Map<string, TrustScore>();
const trustHistory = new Map<string, TrustChange[]>();

export class TrustScoreService {
  /**
   * Get trust score for a user
   * @param {string} userId - User ID
   * @returns {TrustScore | null}
   */
  static getScore(userId: string): TrustScore | null {
    return trustScores.get(userId) || null;
  }

  /**
   * Calculate trust score based on components
   * @param {TrustScore['components']} components - Score components
   * @returns {number} - Overall score (0-100)
   */
  static calculateScore(components: TrustScore['components']): number {
    const weights = {
      identity: 0.25,
      behavior: 0.25,
      activity: 0.20,
      verification: 0.20,
      history: 0.10,
    };

    return Math.round(
      Object.entries(components).reduce((sum, [key, value]) => {
        return sum + (value * weights[key as keyof typeof weights]);
      }, 0)
    );
  }

  /**
   * Determine trust tier based on score
   * @param {number} score - Trust score
   * @returns {TrustTier}
   */
  static getTier(score: number): TrustTier {
    if (score >= 90) return TrustTier.PREMIUM;
    if (score >= 75) return TrustTier.TRUSTED;
    if (score >= 50) return TrustTier.VERIFIED;
    if (score >= 25) return TrustTier.BASIC;
    return TrustTier.UNVERIFIED;
  }

  /**
   * Update trust score for a user
   * @param {string} userId - User ID
   * @param {Partial<TrustScore['components']>} changes - Component changes
   * @param {string} reason - Reason for change
   * @returns {TrustScore}
   */
  static updateScore(
    userId: string,
    changes: Partial<TrustScore['components']>,
    reason: string
  ): TrustScore {
    const current = this.getScore(userId);
    const previousScore = current?.overall || 0;

    const newComponents: TrustScore['components'] = {
      identity: current?.components.identity || 50,
      behavior: current?.components.behavior || 50,
      activity: current?.components.activity || 50,
      verification: current?.components.verification || 50,
      history: current?.components.history || 50,
      ...changes,
    };

    const overall = this.calculateScore(newComponents);
    const tier = this.getTier(overall);

    const trustScore: TrustScore = {
      userId,
      overall,
      components: newComponents,
      lastUpdated: new Date(),
      tier,
    };

    trustScores.set(userId, trustScore);

    // Record history
    const historyEntry: TrustChange = {
      timestamp: new Date(),
      previousScore,
      newScore: overall,
      reason,
      component: Object.keys(changes)[0] as keyof TrustScore['components'],
    };

    const history = trustHistory.get(userId) || [];
    history.push(historyEntry);
    trustHistory.set(userId, history.slice(-100)); // Keep last 100

    return trustScore;
  }

  /**
   * Get trust score history
   * @param {string} userId - User ID
   * @returns {TrustChange[]}
   */
  static getHistory(userId: string): TrustChange[] {
    return trustHistory.get(userId) || [];
  }

  /**
   * Initialize trust score for new user
   * @param {string} userId - User ID
   * @returns {TrustScore}
   */
  static initialize(userId: string): TrustScore {
    const trustScore: TrustScore = {
      userId,
      overall: 50,
      components: {
        identity: 50,
        behavior: 50,
        activity: 50,
        verification: 50,
        history: 50,
      },
      lastUpdated: new Date(),
      tier: TrustTier.BASIC,
    };

    trustScores.set(userId, trustScore);
    return trustScore;
  }
}