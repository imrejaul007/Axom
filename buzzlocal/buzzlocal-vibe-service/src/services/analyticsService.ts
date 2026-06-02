import axios from 'axios';

type AnalyticsEvent = 'map_view' | 'area_view' | 'check_in' | 'check_out';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

export class AnalyticsService {
  /**
   * Track a vibe map event
   */
  async track(event: AnalyticsEvent, data?: EventData): Promise<void> {
    try {
      // Send to ReZ Mind for AI training
      await axios.post(
        `${process.env.MIND_SERVICE_URL || 'http://localhost:4005'}/events`,
        {
          eventType: `vibe_${event}`,
          source: 'buzzlocal_vibe',
          properties: data,
          timestamp: new Date().toISOString(),
        },
        { timeout: 3000 }
      );
    } catch (error) {
      // Fire and forget
    }
  }
}

export const analyticsService = new AnalyticsService();
