/**
 * Rendez - Prive Integration Service
 *
 * Connects Rendez (dating app) to rez-prive-service for Prive membership benefits.
 *
 * PRIMARY: Prive is for CREATORS. This integration adds premium dating benefits
 * for creators who are Prive members.
 *
 * Benefits for Prive members in Rendez:
 * - Verified creator badge
 * - Priority matching
 * - Elite profile highlight
 */

import axios from 'axios';
import { logger } from '../config/logger';

const PRIVÉ_SERVICE_URL = process.env.PRIVE_SERVICE_URL || 'https://rez-prive-service.onrender.com';

// Types
export type PriveTier = 'none' | 'entry' | 'signature' | 'elite';

export interface PriveEligibility {
  isEligible: boolean;
  score: number;
  tier: PriveTier;
  accessState: 'active' | 'grace_period' | 'paused' | 'suspended' | 'revoked';
  trustScore: number;
  pillars?: Array<{
    id: string;
    name: string;
    score: number;
    weight: number;
  }>;
}

export interface RendezPriveBenefits {
  hasPriveAccess: boolean;
  tier: PriveTier;
  benefits: string[];
  badge?: string;
  badgeColor?: string;
  priorityMatching: boolean;
  profileHighlight: boolean;
}

// Prive tier → Rendez benefits mapping
const TIER_BENEFITS: Record<PriveTier, RendezPriveBenefits> = {
  none: {
    hasPriveAccess: false,
    tier: 'none',
    benefits: [],
    priorityMatching: false,
    profileHighlight: false,
  },
  entry: {
    hasPriveAccess: true,
    tier: 'entry',
    benefits: ['Verified member badge', 'Basic matching'],
    badge: 'Prive Member',
    badgeColor: '#C9A962',
    priorityMatching: false,
    profileHighlight: false,
  },
  signature: {
    hasPriveAccess: true,
    tier: 'signature',
    benefits: ['Verified creator badge', 'Priority matching', 'Signature badge'],
    badge: 'Prive Signature',
    badgeColor: '#D4AF37',
    priorityMatching: true,
    profileHighlight: true,
  },
  elite: {
    hasPriveAccess: true,
    tier: 'elite',
    benefits: [
      'VIP creator badge',
      'Top priority matching',
      'Elite profile highlight',
      'Featured in discovery',
      'Concierge support',
    ],
    badge: 'Prive Elite',
    badgeColor: '#FFD700',
    priorityMatching: true,
    profileHighlight: true,
  },
};

class RendezPriveService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PRIVÉ_SERVICE_URL;
  }

  /**
   * Check if user has Prive access
   */
  async checkEligibility(userId: string): Promise<PriveEligibility | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/eligibility`, {
        headers: {
          'X-User-Id': userId,
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
      });

      return response.data?.data || null;
    } catch (error) {
      logger.error('[RendezPrive] Failed to check eligibility', { userId, error });
      return null;
    }
  }

  /**
   * Get Rendez-specific Prive benefits for a user
   */
  async getRendezBenefits(userId: string): Promise<RendezPriveBenefits> {
    const eligibility = await this.checkEligibility(userId);

    if (!eligibility || !eligibility.isEligible) {
      return TIER_BENEFITS.none;
    }

    return TIER_BENEFITS[eligibility.tier];
  }

  /**
   * Get Prive badge for profile display
   */
  async getProfileBadge(userId: string): Promise<{
    showBadge: boolean;
    tier: PriveTier;
    badge: string;
    badgeColor: string;
  }> {
    const benefits = await this.getRendezBenefits(userId);

    if (!benefits.hasPriveAccess) {
      return {
        showBadge: false,
        tier: 'none',
        badge: '',
        badgeColor: '',
      };
    }

    return {
      showBadge: true,
      tier: benefits.tier,
      badge: benefits.badge || '',
      badgeColor: benefits.badgeColor || '',
    };
  }

  /**
   * Check if user should get priority matching
   */
  async hasPriorityMatching(userId: string): Promise<boolean> {
    const benefits = await this.getRendezBenefits(userId);
    return benefits.priorityMatching;
  }

  /**
   * Check if user should get profile highlight
   */
  async hasProfileHighlight(userId: string): Promise<boolean> {
    const benefits = await this.getRendezBenefits(userId);
    return benefits.profileHighlight;
  }

  /**
   * Record engagement signal for 6-Pillar scoring
   */
  async recordEngagement(
    userId: string,
    action: 'match' | 'date' | 'review' | 'profile_view',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/engagement/signal`,
        {
          action: 'rendez_engagement',
          metadata: {
            rendezAction: action,
            ...metadata,
          },
        },
        {
          headers: {
            'X-User-Id': userId,
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          },
        }
      );
    } catch (error) {
      // Non-critical, log only
      logger.warn('[RendezPrive] Failed to record engagement', { userId, action, error });
    }
  }

  /**
   * Get match ranking boost based on Prive tier
   */
  async getMatchBoost(userId: string): Promise<number> {
    const benefits = await this.getRendezBenefits(userId);

    switch (benefits.tier) {
      case 'elite':
        return 2.0; // 2x boost
      case 'signature':
        return 1.5; // 1.5x boost
      case 'entry':
        return 1.2; // 1.2x boost
      default:
        return 1.0; // No boost
    }
  }
}

export const rendezPriveService = new RendezPriveService();
export default rendezPriveService;
