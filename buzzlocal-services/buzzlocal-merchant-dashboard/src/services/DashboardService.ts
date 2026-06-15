import axios from 'axios';
import { MerchantDashboard, EXTERNAL_SERVICES } from '../models/DashboardModels';

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
};

export class DashboardService {
  /**
   * Get or create merchant dashboard
   */
  async getDashboard(merchantId: string) {
    let dashboard = await MerchantDashboard.findOne({ merchantId });

    if (!dashboard) {
      // Create new dashboard
      dashboard = await MerchantDashboard.create({
        merchantId,
        areaId: 'unknown',
        areaName: 'Unknown Area',
        location: { type: 'Point', coordinates: [0, 0] },
        stats: { weeklyViews: 0, weeklyEngagements: 0, weeklyConversions: 0, weeklyRevenue: 0, growth: 0 },
        demand: { currentLevel: 'moderate', trend: 'stable', predictedPeak: 0 },
        competitors: { nearbyCount: 0, avgRating: 0, avgPrice: 0 },
        insights: { bestTime: '12:00', bestDay: 'Saturday', popularCategory: '', topAudience: '' },
        alerts: [],
      });
    }

    // Enrich with external data
    const enrichedDashboard = await this.enrichDashboard(dashboard);

    return enrichedDashboard;
  }

  /**
   * Enrich dashboard with external service data
   */
  private async enrichDashboard(dashboard: any) {
    const enriched = dashboard.toObject();

    try {
      // Fetch demand data from density service
      const [densityData, movementData, intelData] = await Promise.allSettled([
        this.fetchDensityData(enriched.areaId),
        this.fetchMovementData(enriched.areaId),
        this.fetchMerchantIntelData(enriched.merchantId),
      ]);

      if (densityData.status === 'fulfilled' && densityData.value) {
        enriched.demand = { ...enriched.demand, ...densityData.value };
      }

      if (movementData.status === 'fulfilled' && movementData.value) {
        enriched.movementInsights = movementData.value;
      }

      if (intelData.status === 'fulfilled' && intelData.value) {
        enriched.merchantIntel = intelData.value;
      }

      // Generate alerts based on data
      enriched.alerts = this.generateAlerts(enriched);

      enriched.lastUpdated = new Date();
      await dashboard.updateOne({ ...enriched });
    } catch (error) {
      console.error('Error enriching dashboard:', error);
    }

    return enriched;
  }

  /**
   * Fetch density data for area
   */
  private async fetchDensityData(areaId: string) {
    try {
      const response = await axios.get(
        `${EXTERNAL_SERVICES.BUZZLOCAL_DENSITY}/api/density/area/${areaId}`,
        { headers: HEADERS, timeout: 3000 }
      );
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Fetch movement trends for area
   */
  private async fetchMovementData(areaId: string) {
    try {
      const response = await axios.get(
        `${EXTERNAL_SERVICES.BUZZLOCAL_MOVEMENT}/api/movement/trends/${areaId}`,
        { headers: HEADERS, timeout: 3000 }
      );
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Fetch merchant intelligence data
   */
  private async fetchMerchantIntelData(merchantId: string) {
    try {
      const response = await axios.get(
        `${EXTERNAL_SERVICES.REZ_MERCHANT_INTEL}/api/v1/merchant/${merchantId}/insights`,
        { headers: HEADERS, timeout: 3000 }
      );
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Generate actionable alerts
   */
  private generateAlerts(dashboard: any): any[] {
    const alerts = [];

    // Check demand levels
    if (dashboard.demand?.currentLevel === 'low') {
      alerts.push({
        type: 'opportunity',
        message: 'Demand is currently low in your area. Consider running a flash deal or promoting your business.',
        action: 'create_offer',
      });
    }

    // Check for peak hours
    if (dashboard.insights?.bestTime) {
      alerts.push({
        type: 'info',
        message: `Peak activity in your area is around ${dashboard.insights.bestTime}. Schedule promotions accordingly.`,
      });
    }

    // Check competition
    if (dashboard.competitors?.nearbyCount > 10) {
      alerts.push({
        type: 'warning',
        message: `High competition: ${dashboard.competitors.nearbyCount} similar businesses nearby. Consider differentiation.`,
      });
    }

    // Check growth
    if (dashboard.stats?.growth < -10) {
      alerts.push({
        type: 'critical',
        message: 'Significant decline in performance. Review your recent changes or try a promotional campaign.',
      });
    }

    return alerts;
  }

  /**
   * Get area demand heatmap
   */
  async getAreaDemandHeatmap(lat: number, lng: number, radiusKm = 5) {
    try {
      // Fetch from movement service
      const hotspots = await axios.get(
        `${EXTERNAL_SERVICES.BUZZLOCAL_MOVEMENT}/api/movement/hotspots?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
        { headers: HEADERS, timeout: 5000 }
      );

      return {
        success: true,
        hotspots: hotspots.data?.hotspots || [],
      };
    } catch (error) {
      // Return mock data if service unavailable
      return {
        success: true,
        hotspots: this.getMockHeatmap(lat, lng, radiusKm),
      };
    }
  }

  /**
   * Get competitor analysis for area
   */
  async getCompetitorAnalysis(merchantId: string, areaId: string) {
    try {
      // Fetch from merchant intel service
      const response = await axios.get(
        `${EXTERNAL_SERVICES.REZ_MERCHANT_INTEL}/api/v1/merchant/${merchantId}/competitors`,
        { headers: HEADERS, timeout: 5000 }
      );

      return {
        success: true,
        competitors: response.data,
      };
    } catch {
      return {
        success: true,
        competitors: [],
        mock: true,
      };
    }
  }

  /**
   * Get footfall prediction
   */
  async getFootfallPrediction(areaId: string, days = 7) {
    try {
      const trends = await axios.get(
        `${EXTERNAL_SERVICES.BUZZLOCAL_MOVEMENT}/api/movement/trends/${areaId}?days=${days}`,
        { headers: HEADERS, timeout: 5000 }
      );

      // Calculate predicted footfall based on trends
      const avgByHour = trends.data?.trends?.avgByHour || {};
      const predictions = [];

      for (let day = 0; day < days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        // Estimate footfall based on hourly patterns
        let estimatedFootfall = 0;
        for (const [hour, count] of Object.entries(avgByHour)) {
          estimatedFootfall += (count as number) * this.getDayMultiplier(dayName, Number(hour));
        }

        predictions.push({
          date: date.toISOString().split('T')[0],
          day: dayName,
          predictedFootfall: Math.round(estimatedFootfall * 1.1), // 10% growth buffer
          confidence: Object.keys(avgByHour).length > 0 ? 0.75 : 0.3,
        });
      }

      return { success: true, predictions };
    } catch {
      return { success: true, predictions: [], mock: true };
    }
  }

  /**
   * Get optimal deal timing
   */
  async getOptimalDealTiming(areaId: string) {
    try {
      // Get trends
      const trends = await axios.get(
        `${EXTERNAL_SERVICES.BUZZLOCAL_MOVEMENT}/api/movement/trends/${areaId}`,
        { headers: HEADERS, timeout: 5000 }
      );

      const avgByHour = trends.data?.trends?.avgByHour || {};

      // Find low-demand hours for optimal deals
      const sortedHours = Object.entries(avgByHour)
        .sort(([, a], [, b]) => (a as number) - (b as number));

      const lowDemandHours = sortedHours.slice(0, 4).map(([hour]) => Number(hour));

      // Suggest optimal times
      const suggestions = lowDemandHours.map(hour => ({
        hour,
        label: `${hour}:00 - ${hour + 2}:00`,
        reason: 'Low demand period - higher deal impact',
        boostMultiplier: 2.5,
      }));

      return { success: true, suggestions };
    } catch {
      return {
        success: true,
        suggestions: [
          { hour: 14, label: '2:00 PM - 4:00 PM', reason: 'Afternoon lull', boostMultiplier: 2.5 },
          { hour: 15, label: '3:00 PM - 5:00 PM', reason: 'Pre-dinner dip', boostMultiplier: 2.3 },
        ],
      };
    }
  }

  /**
   * Get event impact analysis
   */
  async getEventImpact(areaId: string, eventId?: string) {
    // Check for upcoming events that might affect the area
    // This would integrate with the events service

    return {
      success: true,
      impact: {
        upcomingEvents: 0,
        expectedLift: 0,
        recommendations: [],
      },
    };
  }

  /**
   * Get recommendations for merchant
   */
  async getRecommendations(merchantId: string, areaId: string) {
    const dashboard = await this.getDashboard(merchantId);
    const recommendations = [];

    // Demand-based recommendations
    if (dashboard.demand?.currentLevel === 'low') {
      recommendations.push({
        type: 'deal',
        priority: 'high',
        title: 'Boost Visibility',
        description: 'Create a flash deal or happy hour to attract more customers during low-demand periods.',
        action: 'create_offer',
      });
    }

    // Competition-based recommendations
    if (dashboard.competitors?.nearbyCount > 5) {
      recommendations.push({
        type: 'differentiation',
        priority: 'medium',
        title: 'Stand Out',
        description: 'Focus on unique selling points - reviews, photos, or exclusive offerings.',
        action: 'update_profile',
      });
    }

    // Timing recommendations
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      title: 'Optimal Posting Time',
      description: `Post promotions around ${dashboard.insights?.bestTime} for maximum visibility.`,
      action: 'schedule_post',
    });

    // Content recommendations
    recommendations.push({
      type: 'content',
      priority: 'low',
      title: 'Add Photos',
      description: 'Listings with photos get 3x more engagement. Add at least 5 photos.',
      action: 'add_photos',
    });

    return { success: true, recommendations };
  }

  /**
   * Update merchant stats
   */
  async updateStats(merchantId: string, stats: Partial<any>) {
    await MerchantDashboard.findOneAndUpdate(
      { merchantId },
      {
        $set: {
          ...stats,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    return { success: true };
  }

  /**
   * Helper: Day multiplier for footfall estimation
   */
  private getDayMultiplier(day: string, hour: number): number {
    const baseMultiplier = day === 'Saturday' || day === 'Sunday' ? 1.3 : 1.0;
    const hourMultiplier = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21) ? 1.5 : 0.7;
    return baseMultiplier * hourMultiplier;
  }

  /**
   * Mock heatmap data
   */
  private getMockHeatmap(lat: number, lng: number, radiusKm: number) {
    const hotspots = [];
    const count = Math.floor(radiusKm * 3);

    for (let i = 0; i < count; i++) {
      const offset = (Math.random() - 0.5) * 0.02 * radiusKm;
      hotspots.push({
        areaId: `area_${i}`,
        areaName: `Zone ${i + 1}`,
        lat: lat + offset,
        lng: lng + offset,
        density: Math.floor(Math.random() * 100),
        trend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)],
        category: ['commercial', 'residential', 'mixed'][Math.floor(Math.random() * 3)],
      });
    }

    return hotspots;
  }
}

export const dashboardService = new DashboardService();
