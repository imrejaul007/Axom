/**
 * Trust Scoring Service
 * Unified trust score calculation across all REZ products
 */

import type {
  TrustScore,
  EntityType,
  TrustLevel,
  TrustDimensions,
  TrustFactor,
  FraudCheckResult,
  IdentityResolution,
} from '../types/index.js';

// ============================================
// TRUST LEVEL THRESHOLDS
// ============================================

const TRUST_THRESHOLDS = {
  exceptional: 900,
  excellent: 750,
  good: 600,
  fair: 400,
  poor: 200,
};

const DIMENSION_WEIGHTS = {
  identity: 0.30,      // 30% - Verified identity is crucial
  financial: 0.25,     // 25% - Financial trustworthiness
  behavioral: 0.20,    // 20% - Behavior patterns
  reputation: 0.15,    // 15% - Reviews and feedback
  compliance: 0.10,    // 10% - Regulatory compliance
};

// ============================================
// TRUST SCORE CALCULATION
// ============================================

export class TrustScoringService {
  /**
   * Calculate unified trust score
   */
  calculateTrustScore(
    entityId: string,
    entityType: EntityType,
    fraudCheck?: FraudCheckResult,
    identity?: IdentityResolution
  ): TrustScore {
    const dimensions = this.calculateDimensions(fraudCheck, identity);
    const overall = this.calculateOverallScore(dimensions);
    const factors = this.generateFactors(dimensions, fraudCheck, identity);
    const level = this.getTrustLevel(overall);

    return {
      entityId,
      entityType,
      overall,
      dimensions,
      factors,
      level,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate dimension scores
   */
  private calculateDimensions(
    fraudCheck?: FraudCheckResult,
    identity?: IdentityResolution
  ): TrustDimensions {
    return {
      // Identity dimension (0-100)
      identity: this.calculateIdentityScore(identity),

      // Financial dimension (0-100)
      financial: this.calculateFinancialScore(fraudCheck),

      // Behavioral dimension (0-100)
      behavioral: this.calculateBehavioralScore(fraudCheck, identity),

      // Reputation dimension (0-100)
      reputation: this.calculateReputationScore(identity),

      // Compliance dimension (0-100)
      compliance: this.calculateComplianceScore(fraudCheck, identity),
    };
  }

  /**
   * Calculate identity score
   */
  private calculateIdentityScore(identity?: IdentityResolution): number {
    if (!identity) return 50; // Default for unknown

    let score = 50; // Base score

    // Verified links add points
    const verifiedLinks = identity.links.filter((l) => l.verified).length;
    score += Math.min(20, verifiedLinks * 5);

    // Multiple platforms add trust
    if (identity.platforms.length > 1) {
      score += 10;
    }

    // Cross-platform presence (verified across multiple platforms)
    if (identity.platforms.filter((p) => p.linked).length >= 3) {
      score += 15;
    }

    // Strong relationships indicate established identity
    const strongRelationships = identity.relationships.filter((r) => r.strength > 0.7).length;
    score += Math.min(10, strongRelationships * 5);

    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate financial score
   */
  private calculateFinancialScore(fraudCheck?: FraudCheckResult): number {
    if (!fraudCheck) return 50; // Default

    // Start with inverse of risk score
    let score = 100 - fraudCheck.riskScore;

    // Reduce for high-risk decisions
    if (fraudCheck.decision === 'DENY') {
      score = Math.max(0, score - 50);
    } else if (fraudCheck.decision === 'CHALLENGE') {
      score = Math.max(0, score - 20);
    }

    // Check for critical patterns
    const criticalPatterns = fraudCheck.detectedPatterns.filter(
      (p) => p.type === 'CARD_TESTING' || p.type === 'VELOCITY_ATTACK'
    );
    if (criticalPatterns.length > 0) {
      score = Math.max(0, score - 30);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate behavioral score
   */
  private calculateBehavioralScore(
    fraudCheck?: FraudCheckResult,
    identity?: IdentityResolution
  ): number {
    let score = 50; // Base score

    // Session history
    if (identity) {
      if (identity.profile.totalSessions > 10) {
        score += 20;
      } else if (identity.profile.totalSessions > 5) {
        score += 10;
      }

      // Recency of activity
      const lastSeen = new Date(identity.profile.lastSeen);
      const daysSinceActive = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceActive < 7) {
        score += 15;
      } else if (daysSinceActive < 30) {
        score += 10;
      } else if (daysSinceActive > 90) {
        score -= 10;
      }
    }

    // Fraud factors reduce score
    if (fraudCheck) {
      if (fraudCheck.riskFactors.length > 3) {
        score = Math.max(0, score - 15);
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate reputation score
   */
  private calculateReputationScore(identity?: IdentityResolution): number {
    // This would be enhanced with actual reputation data from:
    // - REZ reviews
    // - Merchant ratings
    // - Community feedback
    // For now, use relationship strength as proxy

    let score = 50; // Base score

    if (identity) {
      const avgRelationshipStrength =
        identity.relationships.length > 0
          ? identity.relationships.reduce((sum, r) => sum + r.strength, 0) /
            identity.relationships.length
          : 0;

      score = 50 + avgRelationshipStrength * 30;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    fraudCheck?: FraudCheckResult,
    identity?: IdentityResolution
  ): number {
    let score = 100; // Start high, reduce for issues

    // Consent status
    if (identity?.consent) {
      if (!identity.consent.analytics) score -= 5;
      if (!identity.consent.marketing) score -= 2;
    }

    // Fraud check reduces compliance
    if (fraudCheck) {
      if (fraudCheck.decision === 'DENY') {
        score = Math.max(0, score - 40);
      } else if (fraudCheck.decision === 'REVIEW') {
        score = Math.max(0, score - 15);
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate overall score from dimensions
   */
  private calculateOverallScore(dimensions: TrustDimensions): number {
    const score =
      dimensions.identity * DIMENSION_WEIGHTS.identity +
      dimensions.financial * DIMENSION_WEIGHTS.financial +
      dimensions.behavioral * DIMENSION_WEIGHTS.behavioral +
      dimensions.reputation * DIMENSION_WEIGHTS.reputation +
      dimensions.compliance * DIMENSION_WEIGHTS.compliance;

    // Scale to 0-1000
    return Math.round(score * 10);
  }

  /**
   * Get trust level from score
   */
  getTrustLevel(score: number): TrustLevel {
    if (score >= TRUST_THRESHOLDS.exceptional) return 'exceptional';
    if (score >= TRUST_THRESHOLDS.excellent) return 'excellent';
    if (score >= TRUST_THRESHOLDS.good) return 'good';
    if (score >= TRUST_THRESHOLDS.fair) return 'fair';
    if (score >= TRUST_THRESHOLDS.poor) return 'poor';
    return 'new';
  }

  /**
   * Generate trust factors
   */
  private generateFactors(
    dimensions: TrustDimensions,
    fraudCheck?: FraudCheckResult,
    identity?: IdentityResolution
  ): TrustFactor[] {
    const factors: TrustFactor[] = [];

    // Identity factors
    factors.push({
      dimension: 'identity',
      positive: identity?.links.filter((l) => l.verified).map((l) => `Verified ${l.type}`) || [],
      negative:
        identity && identity.links.filter((l) => !l.verified).length > 0
          ? ['Unverified links present']
          : [],
      score: dimensions.identity,
    });

    // Financial factors
    factors.push({
      dimension: 'financial',
      positive:
        fraudCheck && fraudCheck.decision === 'ALLOW'
          ? ['No fraud detected']
          : [],
      negative:
        fraudCheck?.riskFactors.map((f) => `Risk factor: ${f}`) || [],
      score: dimensions.financial,
    });

    // Behavioral factors
    factors.push({
      dimension: 'behavioral',
      positive:
        identity && identity.profile.totalSessions > 5
          ? [`${identity.profile.totalSessions} active sessions`]
          : [],
      negative:
        identity && identity.profile.totalSessions < 2
          ? ['Limited activity history']
          : [],
      score: dimensions.behavioral,
    });

    // Reputation factors
    factors.push({
      dimension: 'reputation',
      positive: dimensions.reputation > 60 ? ['Strong relationships'] : [],
      negative: dimensions.reputation < 40 ? ['Limited reputation data'] : [],
      score: dimensions.reputation,
    });

    // Compliance factors
    factors.push({
      dimension: 'compliance',
      positive: dimensions.compliance > 80 ? ['Good compliance record'] : [],
      negative:
        fraudCheck?.decision === 'DENY'
          ? ['Compliance issue detected']
          : [],
      score: dimensions.compliance,
    });

    return factors;
  }

  /**
   * Get recommendations based on trust score
   */
  getRecommendations(score: TrustScore): string[] {
    const recommendations: string[] = [];

    if (score.dimensions.identity < 60) {
      recommendations.push('Complete identity verification to increase trust');
    }

    if (score.dimensions.financial < 50) {
      recommendations.push('Review recent transactions for any discrepancies');
    }

    if (score.dimensions.behavioral < 40) {
      recommendations.push('Build activity history by using the platform regularly');
    }

    if (score.dimensions.reputation < 50) {
      recommendations.push('Encourage positive reviews from verified transactions');
    }

    if (score.dimensions.compliance < 70) {
      recommendations.push('Ensure all required consents are properly granted');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current behavior to preserve trust score');
    }

    return recommendations;
  }
}

// Singleton export
export const trustScoringService = new TrustScoringService();
export default trustScoringService;
