import { MovementEvent, AreaFlow, CommutePattern, MovementHotspot } from '../models/MovementModels';

export class MovementService {
  /**
   * Record a movement event
   */
  async recordMovement(data: {
    userId: string;
    origin: { areaId: string; areaName: string; lat: number; lng: number };
    destination?: { areaId: string; areaName: string; lat: number; lng: number };
    type: 'checkin' | 'checkout' | 'transit' | 'commute';
    context?: { mode?: string; purpose?: string; duration?: number };
  }) {
    const event = new MovementEvent({
      ...data,
      timestamp: new Date(),
    });
    await event.save();

    // Update area flows if destination exists
    if (data.destination && data.type === 'transit') {
      await this.updateAreaFlows(data.origin.areaId, data.origin.areaName, data.destination.areaId, data.destination.areaName);
    }

    // Update hotspots
    await this.updateHotspot(data.origin.areaId, data.origin.areaName, data.origin.lat, data.origin.lng);

    return event;
  }

  /**
   * Update area-to-area flows
   */
  private async updateAreaFlows(fromAreaId: string, fromAreaName: string, toAreaId: string, toAreaName: string) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour = now.getHours();

    // Update outflow from source area
    await AreaFlow.findOneAndUpdate(
      { areaId: fromAreaId, date, hour },
      {
        $inc: { 'outflows.$[elem].count': 1, totalMovement: 1 },
        $setOnInsert: {
          areaName: fromAreaName,
          inflows: [],
          outflows: [{ toAreaId, toAreaName, count: 1 }],
          peakHour: hour,
          peakFlow: 1,
        },
      },
      { upsert: true, arrayFilters: [{ 'elem.toAreaId': toAreaId }] }
    ).catch(async () => {
      // If outflow doesn't exist, add it
      await AreaFlow.findOneAndUpdate(
        { areaId: fromAreaId, date, hour },
        {
          $push: { outflows: { toAreaId, toAreaName, count: 1 } },
          $inc: { totalMovement: 1 },
        },
        { upsert: true }
      );
    });

    // Update inflow to destination area
    await AreaFlow.findOneAndUpdate(
      { areaId: toAreaId, date, hour },
      {
        $inc: { 'inflows.$[elem].count': 1, totalMovement: 1 },
        $setOnInsert: {
          areaName: toAreaName,
          outflows: [],
          inflows: [{ fromAreaId, fromAreaName, count: 1 }],
          peakHour: hour,
          peakFlow: 1,
        },
      },
      { upsert: true, arrayFilters: [{ 'elem.fromAreaId': fromAreaId }] }
    ).catch(async () => {
      await AreaFlow.findOneAndUpdate(
        { areaId: toAreaId, date, hour },
        {
          $push: { inflows: { fromAreaId, fromAreaName, count: 1 } },
          $inc: { totalMovement: 1 },
        },
        { upsert: true }
      );
    });
  }

  /**
   * Update movement hotspot data
   */
  private async updateHotspot(areaId: string, areaName: string, lat: number, lng: number) {
    const existing = await MovementHotspot.findOne({ areaId });

    if (existing) {
      // Increment density with decay
      const decayFactor = 0.95;
      const newDensity = Math.min(100, (existing.currentDensity * decayFactor) + 10);

      existing.currentDensity = newDensity;
      existing.lastUpdated = new Date();
      await existing.save();
    } else {
      await MovementHotspot.create({
        areaId,
        areaName,
        location: { type: 'Point', coordinates: [lng, lat] },
        currentDensity: 20,
        trend: 'stable',
        velocity: 0,
        direction: 'unknown',
        peakHours: [9, 12, 18, 21],
        category: 'mixed',
      });
    }
  }

  /**
   * Detect user's commute pattern
   */
  async detectCommutePattern(userId: string): Promise<any | null> {
    const recentEvents = await MovementEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    if (recentEvents.length < 20) return null;

    // Find most common check-in/check-out pairs
    const patterns: Record<string, { home: string; work: string; count: number }> = {};

    for (let i = 0; i < recentEvents.length - 1; i++) {
      const current = recentEvents[i];
      const next = recentEvents[i + 1];

      if (current.type === 'checkout' && next.type === 'checkin') {
        const key = `${next.origin.areaId}-${current.origin.areaId}`;
        if (!patterns[key]) {
          patterns[key] = { home: next.origin.areaId, work: current.origin.areaId, count: 0 };
        }
        patterns[key].count++;
      }
    }

    // Find strongest pattern
    let bestPattern = null;
    let maxCount = 0;

    for (const p of Object.values(patterns)) {
      if (p.count > maxCount) {
        maxCount = p.count;
        bestPattern = p;
      }
    }

    if (!bestPattern || maxCount < 5) return null;

    // Calculate typical times
    const checkoutTimes = recentEvents
      .filter(e => e.type === 'checkout')
      .map(e => new Date(e.timestamp).getHours());

    const checkinTimes = recentEvents
      .filter(e => e.type === 'checkin')
      .map(e => new Date(e.timestamp).getHours());

    const avgCheckout = checkoutTimes.length > 0
      ? Math.round(checkoutTimes.reduce((a, b) => a + b, 0) / checkoutTimes.length)
      : 9;
    const avgCheckin = checkinTimes.length > 0
      ? Math.round(checkinTimes.reduce((a, b) => a + b, 0) / checkinTimes.length)
      : 18;

    const pattern = await CommutePattern.findOneAndUpdate(
      { userId },
      {
        homeAreaId: bestPattern.home,
        workAreaId: bestPattern.work,
        confidence: Math.min(1, maxCount / 30),
        typicalDepartureTime: `${avgCheckout}:00`,
        typicalArrivalTime: `${avgCheckin}:00`,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    return pattern;
  }

  /**
   * Get area movement trends
   */
  async getAreaTrends(areaId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const flows = await AreaFlow.find({
      areaId,
      date: { $gte: startDate },
    }).sort({ date: 1, hour: 1 });

    const hourlyTrend: Record<number, number[]> = {};

    for (const flow of flows) {
      if (!hourlyTrend[flow.hour]) {
        hourlyTrend[flow.hour] = [];
      }
      hourlyTrend[flow.hour].push(flow.totalMovement);
    }

    const avgByHour: Record<number, number> = {};
    for (const [hour, values] of Object.entries(hourlyTrend)) {
      avgByHour[Number(hour)] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    return {
      areaId,
      days,
      avgByHour,
      peakHour: Object.entries(avgByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || 9,
      totalMovement: flows.reduce((sum, f) => sum + f.totalMovement, 0),
    };
  }

  /**
   * Get flow between two areas
   */
  async getAreaToAreaFlow(fromAreaId: string, toAreaId: string, date?: Date) {
    const targetDate = date || new Date();
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const flows = await AreaFlow.find({
      areaId: fromAreaId,
      date: dayStart,
      'outflows.toAreaId': toAreaId,
    });

    const totalFlow = flows.reduce((sum, f) => {
      const outflow = f.outflows.find(o => o.toAreaId === toAreaId);
      return sum + (outflow?.count || 0);
    }, 0);

    return {
      fromAreaId,
      toAreaId,
      date: dayStart,
      totalFlow,
      hourlyBreakdown: flows.map(f => ({
        hour: f.hour,
        count: f.outflows.find(o => o.toAreaId === toAreaId)?.count || 0,
      })),
    };
  }

  /**
   * Get hotspots near a location
   */
  async getNearbyHotspots(lat: number, lng: number, radiusKm = 5, limit = 10) {
    const hotspots = await MovementHotspot.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit);

    return hotspots.map(h => ({
      areaId: h.areaId,
      areaName: h.areaName,
      lat: h.location.coordinates[1],
      lng: h.location.coordinates[0],
      density: h.currentDensity,
      trend: h.trend,
      velocity: h.velocity,
      category: h.category,
      peakHours: h.peakHours,
    }));
  }

  /**
   * Predict movement to an area
   */
  async predictArrivals(areaId: string, targetHour: number) {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Get historical data for same day of week
    const flows = await AreaFlow.find({
      areaId,
      date: { $gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) },
    });

    const relevantFlows = flows.filter(f => {
      const d = new Date(f.date);
      return d.getDay() === dayOfWeek;
    });

    const hourFlows = relevantFlows.filter(f => Math.abs(f.hour - targetHour) <= 2);

    const avgInflow = hourFlows.reduce((sum, f) => {
      return sum + f.inflows.reduce((s, i) => s + i.count, 0);
    }, 0) / Math.max(1, hourFlows.length);

    return {
      areaId,
      targetHour,
      predictedArrivals: Math.round(avgInflow * 1.1), // Add 10% buffer
      confidence: hourFlows.length > 0 ? Math.min(1, hourFlows.length / 4) : 0,
    };
  }

  /**
   * Get movement corridor between two areas
   */
  async getMovementCorridor(areaA: string, areaB: string) {
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const flowsAtoB = await AreaFlow.find({
      areaId: areaA,
      date: { $gte: startDate },
      'outflows.toAreaId': areaB,
    });

    const flowsBtoA = await AreaFlow.find({
      areaId: areaB,
      date: { $gte: startDate },
      'outflows.toAreaId': areaA,
    });

    const totalAtoB = flowsAtoB.reduce((sum, f) => {
      const out = f.outflows.find(o => o.toAreaId === areaB);
      return sum + (out?.count || 0);
    }, 0);

    const totalBtoA = flowsBtoA.reduce((sum, f) => {
      const out = f.outflows.find(o => o.toAreaId === areaA);
      return sum + (out?.count || 0);
    }, 0);

    // Find peak hours
    const peakHoursAtoB = this.findPeakHours(flowsAtoB, areaB);
    const peakHoursBtoA = this.findPeakHours(flowsBtoA, areaA);

    return {
      areaA,
      areaB,
      totalAtoB,
      totalBtoA,
      netFlow: totalAtoB - totalBtoA,
      peakHoursAtoB,
      peakHoursBtoA,
      ratio: totalAtoB / Math.max(1, totalBtoA),
    };
  }

  private findPeakHours(flows: any[], targetAreaId: string): number[] {
    const hourlyCounts: Record<number, number> = {};

    for (const f of flows) {
      const out = f.outflows.find((o: any) => o.toAreaId === targetAreaId);
      if (out) {
        hourlyCounts[f.hour] = (hourlyCounts[f.hour] || 0) + out.count;
      }
    }

    const sorted = Object.entries(hourlyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => Number(h));

    return sorted;
  }
}

export const movementService = new MovementService();
