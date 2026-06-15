import { CREDIBILITY_WEIGHTS } from '../models/SafetyModels';

interface CredibilityInput {
  authorTrustLevel: string;
  authorTrustScore: number;
  hasGPS: boolean;
  hasPhoto: boolean;
  hasVideo: boolean;
  descriptionLength: number;
  reportCount: number;
  disputeCount: number;
  previousAlerts?: number;
  previousFalseAlerts?: number;
}

export class CredibilityEngine {
  calculate(input: CredibilityInput): number {
    let score = 50;

    // Trust level contribution
    const trustLevels: Record<string, number> = {
      legend: 30,
      guardian: 25,
      expert: 20,
      trusted: 15,
      verified: 10,
      new: 0
    };
    score += trustLevels[input.authorTrustLevel] || 0;

    // Trust score contribution (up to 10 extra points)
    score += Math.min(10, input.authorTrustScore / 50);

    // Evidence factors
    if (input.hasGPS) score += CREDIBILITY_WEIGHTS.gps_match;
    if (input.hasPhoto) score += CREDIBILITY_WEIGHTS.photo_evidence;
    if (input.hasVideo) score += CREDIBILITY_WEIGHTS.video_evidence;

    // Description quality
    if (input.descriptionLength > 50) score += 5;
    if (input.descriptionLength < 20) score -= 10;

    // Report/dispute ratio
    score += Math.min(30, input.reportCount * 5);
    score -= Math.min(50, input.disputeCount * 10);

    // Previous false alerts penalty
    if (input.previousFalseAlerts && input.previousFalseAlerts > 0) {
      score -= Math.min(50, input.previousFalseAlerts * CREDIBILITY_WEIGHTS.previous_false);
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  getRiskLevel(credibility: number): 'low' | 'medium' | 'high' | 'critical' {
    if (credibility >= 80) return 'low';
    if (credibility >= 60) return 'medium';
    if (credibility >= 40) return 'high';
    return 'critical';
  }

  async verifyWithAI(alert: any): Promise<{ verified: boolean; confidence: number; reason?: string }> {
    // In production, this would call an AI model to verify
    // For now, simulate verification
    const hasEvidence = (alert.images && alert.images.length > 0) ||
                        (alert.evidence && alert.evidence.length > 0);

    if (hasEvidence && alert.credibility >= 70) {
      return {
        verified: true,
        confidence: 0.9,
        reason: 'AI verified based on evidence and credibility score'
      };
    }

    return {
      verified: false,
      confidence: 0.5,
      reason: 'Needs more evidence or community verification'
    };
  }
}
