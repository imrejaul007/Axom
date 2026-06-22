import { Server as SocketIOServer } from 'socket.io';
import { SafetyAlert, CREDIBILITY_WEIGHTS } from '../models/SafetyModels';

export class AlertProcessor {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async calculateAndUpdateCredibility(alert: any): Promise<number> {
    let credibility = 50; // Base score

    // GPS matches location
    credibility += CREDIBILITY_WEIGHTS.gps_match;

    // Multiple reports in same area
    const nearbyAlerts = await SafetyAlert.countDocuments({
      'location.area': alert.location.area,
      type: alert.type,
      status: 'verified',
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (nearbyAlerts > 0) {
      credibility += Math.min(CREDIBILITY_WEIGHTS.multiple_reports, nearbyAlerts * 10);
    }

    // Trusted user bonus
    const trustScores: Record<string, number> = {
      legend: 25,
      guardian: 20,
      expert: 15,
      trusted: 10,
      verified: 5,
      new: 0
    };

    const trustBonus = trustScores[alert.author.trustLevel] || 0;
    credibility += trustBonus;

    // Photo/video evidence
    if (alert.images && alert.images.length > 0) {
      credibility += CREDIBILITY_WEIGHTS.photo_evidence;
    }
    if (alert.evidence && alert.evidence.some((e: string) => e.includes('video'))) {
      credibility += CREDIBILITY_WEIGHTS.video_evidence;
    }

    // Apply reports
    const confirms = alert.confirmedBy?.length || 0;
    const disputes = alert.disputedBy?.length || 0;

    credibility += confirms * 5;
    credibility -= disputes * 10;

    // Clamp to 0-100
    credibility = Math.max(0, Math.min(100, credibility));

    // Update alert
    alert.credibility = credibility;
    alert.verificationScore = credibility;

    // Update status based on credibility
    if (credibility >= 80 && confirms >= 3) {
      alert.status = 'verified';
    } else if (credibility <= 20 || disputes >= 5) {
      alert.status = 'false';
    }

    await alert.save();

    return credibility;
  }

  async processAlert(alert: any): Promise<void> {
    // Emit to area subscribers
    this.io.to(`area:${alert.location.area}`).emit('new:alert', {
      id: alert._id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      location: alert.location,
      credibility: alert.credibility,
      author: {
        trustLevel: alert.author.trustLevel
      }
    });

    // Emit to all safety subscribers
    this.io.to('alerts:all').emit('safety:alert', {
      id: alert._id,
      type: alert.type,
      severity: alert.severity,
      location: alert.location
    });

    // Check for pattern (multiple similar alerts)
    const pattern = await this.detectPattern(alert);
    if (pattern) {
      this.io.to('alerts:all').emit('safety:pattern', {
        pattern,
        area: alert.location.area
      });
    }
  }

  async detectPattern(alert: any): Promise<string | null> {
    // Check for multiple alerts of same type in same area in short time
    const recentAlerts = await SafetyAlert.countDocuments({
      'location.area': alert.location.area,
      type: alert.type,
      status: { $in: ['active', 'verified'] },
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    });

    if (recentAlerts >= 3) {
      return `Multiple ${alert.type} alerts in ${alert.location.area}`;
    }

    return null;
  }

  async resolveAlert(alertId: string, resolvedBy: string, resolution: string): Promise<void> {
    const alert = await SafetyAlert.findById(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolution = resolution;

    await alert.save();

    // Notify subscribers
    this.io.to(`area:${alert.location.area}`).emit('resolve:alert', {
      alertId,
      resolution,
      resolvedBy
    });
  }
}
