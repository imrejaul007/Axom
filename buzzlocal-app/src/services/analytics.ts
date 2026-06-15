import { feedApi, mindApi } from './api';

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

export const analyticsService = {
  /**
   * Track a single event
   */
  track: async (event: AnalyticsEvent, data?: EventData): Promise<void> => {
    try {
      await feedApi.post('/analytics/track', {
        event,
        data: {
          ...data,
          source: 'buzzlocal_app',
          timestamp: new Date().toISOString(),
        },
      });

      // Also send to ReZ Mind for AI training
      await mindApi.post('/events', {
        eventType: event,
        source: 'buzzlocal',
        properties: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Don't throw - analytics should not break the app
      console.warn('Analytics tracking failed:', error);
    }
  },

  /**
   * Track multiple events in batch
   */
  trackBatch: async (events: { event: AnalyticsEvent; data?: EventData }[]): Promise<void> => {
    try {
      const formattedEvents = events.map((e) => ({
        ...e,
        data: {
          ...e.data,
          source: 'buzzlocal_app',
          timestamp: new Date().toISOString(),
        },
      }));

      await feedApi.post('/analytics/track/batch', { events: formattedEvents });
    } catch (error) {
      console.warn('Batch analytics tracking failed:', error);
    }
  },

  /**
   * Track screen view
   */
  screenView: async (screenName: string, params?: EventData): Promise<void> => {
    await analyticsService.track('map_view', {
      screen: screenName,
      ...params,
    });
  },

  /**
   * Track user engagement
   */
  trackEngagement: async (
    postId: string,
    action: 'view' | 'like' | 'comment' | 'save' | 'share'
  ): Promise<void> => {
    const eventMap: Record<string, AnalyticsEvent> = {
      view: 'post_view',
      like: 'post_like',
      comment: 'post_comment',
      save: 'post_save',
      share: 'post_share',
    };

    await analyticsService.track(eventMap[action], { postId });
  },

  /**
   * Track location-based actions
   */
  trackLocationAction: async (
    action: 'check_in' | 'check_out' | 'location_search',
    location: { latitude: number; longitude: number },
    placeId?: string
  ): Promise<void> => {
    await analyticsService.track(action, {
      latitude: location.latitude,
      longitude: location.longitude,
      placeId,
    });
  },

  /**
   * Track commerce actions
   */
  trackCommerce: async (
    action: 'view' | 'redeem' | 'earn' | 'spend',
    amount?: number,
    description?: string
  ): Promise<void> => {
    const eventMap: Record<string, AnalyticsEvent> = {
      view: 'offer_view',
      redeem: 'offer_redeem',
      earn: 'coin_earn',
      spend: 'coin_spend',
    };

    await analyticsService.track(eventMap[action], {
      amount,
      description,
    });
  },
};
