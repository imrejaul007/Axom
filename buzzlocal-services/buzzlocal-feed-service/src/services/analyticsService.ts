import axios from 'axios';

type AnalyticsEvent =
  | 'check_in'
  | 'check_out'
  | 'location_search'
  | 'map_view'
  | 'post_view'
  | 'post_like'
  | 'post_comment'
  | 'post_save'
  | 'post_share'
  | 'event_view'
  | 'event_rsvp'
  | 'event_attend'
  | 'offer_view'
  | 'offer_redeem'
  | 'coin_earn'
  | 'coin_spend'
  | 'user_follow'
  | 'community_join'
  | 'mention'
  | 'post_create'
  | 'alert_create';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

export class AnalyticsService {
  private eventBuffer: { event: AnalyticsEvent; data: EventData; timestamp: string }[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor() {
    // Flush events every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  /**
   * Track a single event
   */
  async track(event: AnalyticsEvent, data?: EventData): Promise<void> {
    this.eventBuffer.push({
      event,
      data: {
        ...data,
        source: 'buzzlocal_feed_service',
      },
      timestamp: new Date().toISOString(),
    });

    // Send to ReZ Mind for AI training (async)
    this.sendToMind(event, data).catch(console.error);

    // Flush if buffer is large
    if (this.eventBuffer.length >= 10) {
      await this.flush();
    }
  }

  /**
   * Batch track multiple events
   */
  async trackBatch(events: { event: AnalyticsEvent; data?: EventData }[]): Promise<void> {
    events.forEach(({ event, data }) => {
      this.eventBuffer.push({
        event,
        data: { ...data, source: 'buzzlocal_feed_service' },
        timestamp: new Date().toISOString(),
      });
    });

    if (this.eventBuffer.length >= 10) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to analytics service
   */
  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Send to analytics service
      await axios.post(
        `${process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4006'}/events/batch`,
        { events },
        { timeout: 5000 }
      );
    } catch (error) {
      // Put events back in buffer
      this.eventBuffer.unshift(...events);
      console.error('Failed to flush analytics:', error);
    }
  }

  /**
   * Send event to ReZ Mind for AI training
   */
  private async sendToMind(event: AnalyticsEvent, data?: EventData): Promise<void> {
    try {
      await axios.post(
        `${process.env.MIND_SERVICE_URL || 'http://localhost:4005'}/events`,
        {
          eventType: event,
          source: 'buzzlocal',
          properties: data,
          timestamp: new Date().toISOString(),
        },
        { timeout: 3000 }
      );
    } catch (error) {
      // Don't log - this is fire-and-forget
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

export const analyticsService = new AnalyticsService();
