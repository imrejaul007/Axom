import { QRKiosk, LocationTrigger, DOOHIntegration, QRScan } from '../models/OO2IModels';
import axios from 'axios';

const DOOH_SERVICE_URL = process.env.DOOH_SERVICE_URL || 'http://localhost:4018';
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
};

export class OO2IService {
  // ===== QR KIOSKS =====

  /**
   * Register a new QR kiosk
   */
  async registerKiosk(data: {
    kioskId: string;
    type: 'society' | 'merchant' | 'event' | 'transit';
    ownerId: string;
    ownerType: 'society' | 'merchant' | 'event';
    location: { lat: number; lng: number };
    address?: string;
    areaId: string;
    areaName: string;
    display?: { screenSize: string; orientation: 'portrait' | 'landscape' };
  }) {
    const kiosk = await QRKiosk.create({
      ...data,
      location: { type: 'Point', coordinates: [data.location.lng, data.location.lat] },
      stats: { totalScans: 0, uniqueUsers: 0 },
    });
    return kiosk;
  }

  /**
   * Get kiosk by ID
   */
  async getKiosk(kioskId: string) {
    return QRKiosk.findOne({ kioskId });
  }

  /**
   * Get kiosks near location
   */
  async getNearbyKiosks(lat: number, lng: number, radiusKm = 1) {
    return QRKiosk.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
      status: 'active',
    }).limit(20);
  }

  /**
   * Update kiosk stats
   */
  async updateKioskStats(kioskId: string) {
    const kiosk = await QRKiosk.findOne({ kioskId });
    if (!kiosk) return null;

    kiosk.stats.totalScans += 1;
    kiosk.stats.lastScan = new Date();
    await kiosk.save();

    return kiosk;
  }

  // ===== QR SCANS =====

  /**
   * Record QR scan
   */
  async recordScan(data: {
    qrId: string;
    qrType: 'society' | 'merchant' | 'event' | 'offer' | 'product';
    userId?: string;
    guestId?: string;
    location: { lat: number; lng: number };
    areaId: string;
    areaName: string;
    source: 'app' | 'camera' | 'kiosk';
    triggeredBy?: 'proximity' | 'manual' | 'scheduled';
  }) {
    const scan = await QRScan.create({
      ...data,
      scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: { type: 'Point', coordinates: [data.location.lng, data.location.lat] },
    });

    // Update kiosk stats if applicable
    if (data.qrType === 'merchant') {
      await this.updateKioskStats(data.qrId);
    }

    return scan;
  }

  /**
   * Get scan analytics for QR
   */
  async getScanAnalytics(qrId: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const scans = await QRScan.find({
      qrId,
      createdAt: { $gte: since },
    });

    const uniqueUsers = new Set(scans.map(s => s.userId || s.guestId)).size;

    // Hourly distribution
    const hourlyDistribution: Record<number, number> = {};
    for (const scan of scans) {
      const hour = new Date(scan.createdAt).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    }

    // Location clustering
    const locations = scans.map(s => ({
      lat: s.location.coordinates[1],
      lng: s.location.coordinates[0],
    }));

    return {
      totalScans: scans.length,
      uniqueUsers,
      conversions: scans.filter(s => s.conversion).length,
      conversionRate: scans.length > 0 ? (scans.filter(s => s.conversion).length / scans.length * 100).toFixed(2) : 0,
      hourlyDistribution,
      avgDailyScans: (scans.length / days).toFixed(1),
    };
  }

  // ===== LOCATION TRIGGERS =====

  /**
   * Create location trigger
   */
  async createTrigger(data: {
    type: 'proximity' | 'time' | 'event' | 'qr_scan';
    condition: {
      areaId?: string;
      radius?: number;
      timeRange?: { start: string; end: string };
      eventId?: string;
      category?: string;
    };
    action: {
      type: 'offer' | 'notification' | 'deeplink' | 'content';
      payload: Record<string, any>;
    };
    priority?: number;
  }) {
    const trigger = await LocationTrigger.create({
      ...data,
      triggerId: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      active: true,
    });
    return trigger;
  }

  /**
   * Get triggers for location
   */
  async getTriggersForLocation(lat: number, lng: number, areaId: string) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Get nearby kiosks
    const nearbyKiosks = await this.getNearbyKiosks(lat, lng, 0.5);

    // Get active triggers for area
    const triggers = await LocationTrigger.find({
      active: true,
      $or: [
        { 'condition.areaId': areaId },
        { 'condition.areaId': { $exists: false } },
      ],
    }).sort({ priority: -1 });

    // Filter time-based triggers
    const activeTriggers = triggers.filter(t => {
      if (t.type === 'time' && t.condition.timeRange) {
        return currentTime >= t.condition.timeRange.start && currentTime <= t.condition.timeRange.end;
      }
      return true;
    });

    return {
      triggers: activeTriggers,
      nearbyKiosks: nearbyKiosks.map(k => ({
        kioskId: k.kioskId,
        type: k.type,
        address: k.address,
        distance: this.calculateDistance(lat, lng, k.location.coordinates[1], k.location.coordinates[0]),
      })),
    };
  }

  /**
   * Trigger an action (send notification, deeplink, etc.)
   */
  async triggerAction(userId: string, trigger: any) {
    const { type, payload } = trigger.action;

    switch (type) {
      case 'notification':
        await this.sendNotification(userId, payload);
        break;
      case 'deeplink':
        return { type: 'deeplink', url: payload.url };
      case 'offer':
        return { type: 'offer', offer: payload };
      case 'content':
        return { type: 'content', content: payload };
    }

    return { triggered: true };
  }

  private async sendNotification(userId: string, payload: any) {
    try {
      await axios.post(
        `${NOTIFY_URL}/api/push`,
        {
          userId,
          title: payload.title || 'BuzzLocal',
          body: payload.body || '',
          data: payload.data || {},
        },
        { headers: HEADERS, timeout: 5000 }
      );
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  // ===== DOOH INTEGRATION =====

  /**
   * Register DOOH screen
   */
  async registerDOOHScreen(data: {
    screenId: string;
    screenName: string;
    location: { lat: number; lng: number };
    areaId: string;
    areaName: string;
    ownerId: string;
    screenType: 'billboard' | 'kiosk' | 'taxi' | 'elevator' | 'restaurant';
    specs?: { width: number; height: number; orientation: string };
  }) {
    const screen = await DOOHIntegration.create({
      ...data,
      location: { type: 'Point', coordinates: [data.location.lng, data.location.lat] },
      stats: { impressions: 0, interactions: 0, conversions: 0 },
      status: 'pending',
    });
    return screen;
  }

  /**
   * Get DOOH screens near location
   */
  async getNearbyScreens(lat: number, lng: number, radiusKm = 2) {
    return DOOHIntegration.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
      status: 'active',
    }).limit(20);
  }

  /**
   * Update screen content from DOOH service
   */
  async syncDOOHContent(screenId: string, content: string) {
    return DOOHIntegration.findOneAndUpdate(
      { screenId },
      {
        $set: { 'content.currentContent': content },
        status: 'active',
      },
      { new: true }
    );
  }

  /**
   * Record DOOH impression
   */
  async recordImpression(screenId: string) {
    return DOOHIntegration.findOneAndUpdate(
      { screenId },
      { $inc: { 'stats.impressions': 1 } },
      { new: true }
    );
  }

  /**
   * Record DOOH interaction
   */
  async recordInteraction(screenId: string, userId: string, action: string) {
    const scan = await QRScan.create({
      scanId: `dooh_${Date.now()}`,
      qrId: screenId,
      qrType: 'merchant',
      userId,
      location: { type: 'Point', coordinates: [0, 0] },
      areaId: '',
      areaName: '',
      source: 'kiosk',
      triggeredBy: 'proximity',
      conversion: { action, timestamp: new Date() },
    });

    await DOOHIntegration.findOneAndUpdate(
      { screenId },
      { $inc: { 'stats.interactions': 1 } }
    );

    return scan;
  }

  // ===== ANALYTICS =====

  /**
   * Get overall OO2I analytics
   */
  async getAnalytics(areaId?: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const query: any = { createdAt: { $gte: since } };
    if (areaId) query.areaId = areaId;

    const scans = await QRScan.find(query);

    // QR Kiosk stats
    const kiosks = await QRKiosk.countDocuments({ status: 'active' });

    // DOOH screen stats
    const screens = await DOOHIntegration.countDocuments({ status: 'active' });

    // Scan trends
    const dailyScans: Record<string, number> = {};
    for (const scan of scans) {
      const day = new Date(scan.createdAt).toISOString().split('T')[0];
      dailyScans[day] = (dailyScans[day] || 0) + 1;
    }

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    for (const scan of scans) {
      sourceBreakdown[scan.source] = (sourceBreakdown[scan.source] || 0) + 1;
    }

    // QR Type breakdown
    const typeBreakdown: Record<string, number> = {};
    for (const scan of scans) {
      typeBreakdown[scan.qrType] = (typeBreakdown[scan.qrType] || 0) + 1;
    }

    return {
      period: { start: since.toISOString(), end: new Date().toISOString(), days },
      totalScans: scans.length,
      uniqueUsers: new Set(scans.map(s => s.userId || s.guestId)).size,
      conversions: scans.filter(s => s.conversion).length,
      activeKiosks: kiosks,
      activeScreens: screens,
      dailyScans,
      sourceBreakdown,
      typeBreakdown,
    };
  }

  // ===== HELPERS =====

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const oo2iService = new OO2IService();
