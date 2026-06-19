/**
 * REZ Trust OS - Reputation Service
 * @module services/reputationService
 */

import type { ReputationScore } from '../types.js';
import { ReputationLevel } from '../types.js';

// In-memory store
const reputations = new Map<string, ReputationScore>();

export class ReputationService {
  /**
   * Get reputation score
   * @param {string} userId - User ID
   * @returns {ReputationScore | null}
   */
  static getScore(userId: string): ReputationScore | null {
    return reputations.get(userId) || null;
  }

  /**
   * Determine reputation level
   * @param {number} score - Reputation score
   * @returns {ReputationLevel}
   */
  static getLevel(score: number): ReputationLevel {
    if (score >= 90) return ReputationLevel.ELITE;
    if (score >= 75) return ReputationLevel.EXPERT;
    if (score >= 50) return ReputationLevel.CONTRIBUTOR;
    if (score >= 25) return ReputationLevel.ACTIVE;
    return ReputationLevel.NEW;
  }

  /**
   * Initialize reputation for new user
   * @param {string} userId - User ID
   * @returns {ReputationScore}
   */
  static initialize(userId: string): ReputationScore {
    const reputation: ReputationScore = {
      userId,
      score: 50,
      reviews: 0,
      avgRating: 0,
      badges: [],
      level: ReputationLevel.NEW,
    };

    reputations.set(userId, reputation);
    return reputation;
  }

  /**
   * Add a review
   * @param {string} userId - User ID
   * @param {number} rating - Rating (1-5)
   * @returns {ReputationScore}
   */
  static addReview(userId: string, rating: number): ReputationScore {
    const current = this.getScore(userId) || this.initialize(userId);

    const newReviews = current.reviews + 1;
    const newAvgRating = (current.avgRating * current.reviews + rating) / newReviews;
    const newScore = Math.round(newAvgRating * 20); // Scale to 0-100

    const reputation: ReputationScore = {
      ...current,
      score: newScore,
      reviews: newReviews,
      avgRating: Math.round(newAvgRating * 10) / 10,
      level: this.getLevel(newScore),
    };

    reputations.set(userId, reputation);
    return reputation;
  }

  /**
   * Add a badge
   * @param {string} userId - User ID
   * @param {string} badge - Badge name
   * @returns {ReputationScore}
   */
  static addBadge(userId: string, badge: string): ReputationScore {
    const current = this.getScore(userId) || this.initialize(userId);

    if (current.badges.includes(badge)) {
      return current;
    }

    const reputation: ReputationScore = {
      ...current,
      badges: [...current.badges, badge],
      score: Math.min(100, current.score + 5), // +5 for badge
    };

    reputations.set(userId, reputation);
    return reputation;
  }

  /**
   * Remove a badge
   * @param {string} userId - User ID
   * @param {string} badge - Badge name
   * @returns {ReputationScore}
   */
  static removeBadge(userId: string, badge: string): ReputationScore {
    const current = this.getScore(userId);
    if (!current) {
      return this.initialize(userId);
    }

    const reputation: ReputationScore = {
      ...current,
      badges: current.badges.filter((b) => b !== badge),
      score: Math.max(0, current.score - 5),
    };

    reputations.set(userId, reputation);
    return reputation;
  }
}