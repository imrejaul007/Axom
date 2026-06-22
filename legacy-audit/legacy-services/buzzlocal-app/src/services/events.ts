import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Service URLs
const EVENTS_URL = process.env.EXPO_PUBLIC_EVENTS_URL || 'https://buzzlocal-events.onrender.com';
const REZ_EVENT_PLATFORM = process.env.EXPO_PUBLIC_REZ_EVENTS_URL || 'https://rez-event-platform.onrender.com';

// API instance
const api = axios.create({
  baseURL: EVENTS_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Id'] = 'buzzlocal';
  return config;
});

// Track events for REZ Mind
const trackToREZ = async (eventType: string, data) => {
  try {
    await axios.post(`${REZ_EVENT_PLATFORM}/events`, {
      type: eventType,
      data,
      source: 'buzzlocal',
      timestamp: Date.now(),
    }, {
      timeout: 5000,
    });
  } catch (error) {
    // Don't fail main operation if tracking fails
    console.log('REZ tracking failed (non-critical):', eventType);
  }
};

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    area?: string;
    city?: string;
  };
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  organizer: {
    id: string;
    name: string;
    verified: boolean;
  };
  isPaid: boolean;
  ticketPrice?: number;
  maxAttendees?: number;
  currentAttendees: number;
  interestedCount: number;
  savedCount: number;
  status: string;
  qrCode?: string;
  isInterested?: boolean;
  predictedAttendance?: number;
  predictedPeakTime?: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  quantity: number;
  totalAmount: number;
  status: string;
  purchasedAt: string;
  checkedInAt?: string;
  event: Event | null;
}

export interface EventFilters {
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  date?: string;
  free?: boolean;
  page?: number;
  limit?: number;
}

class EventsService {
  /**
   * Get events with filters
   */
  async getEvents(params?: EventFilters): Promise<{
    events: Event[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch events';
      throw new Error(message);
    }
  }

  /**
   * Get trending events
   */
  async getTrendingEvents(limit: number = 10): Promise<Event[]> {
    try {
      const response = await api.get('/events/trending', { params: { limit } });
      return response.data.events;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch trending events';
      throw new Error(message);
    }
  }

  /**
   * Get nearby events
   */
  async getNearbyEvents(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
  }): Promise<Event[]> {
    try {
      const response = await api.get('/events/nearby', { params });
      return response.data.events;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch nearby events';
      throw new Error(message);
    }
  }

  /**
   * Get single event
   */
  async getEvent(eventId: string): Promise<Event> {
    try {
      const response = await api.get(`/events/${eventId}`);

      // Track view to REZ Mind
      const event = response.data;
      await trackToREZ('event_view', {
        eventId: event.id,
        category: event.category,
        location: event.location,
        organizerId: event.organizer.id,
      });

      return event;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch event';
      throw new Error(message);
    }
  }

  /**
   * Express interest in event
   */
  async expressInterest(eventId: string): Promise<{ interested: boolean; newCount: number }> {
    try {
      const response = await api.post(`/events/${eventId}/interest`);
      const result = response.data;

      // Track to REZ Mind
      await trackToREZ('event_interest', {
        eventId,
        interested: result.interested,
        category: 'unknown', // Would get from event
      });

      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to express interest';
      throw new Error(message);
    }
  }

  /**
   * Create event
   */
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await api.post('/events', eventData);
      const event = response.data;

      // Track to REZ Event Platform
      await trackToREZ('event_created', {
        eventId: event.id,
        title: event.title,
        category: event.category,
        location: event.location,
        isPaid: event.isPaid,
        ticketPrice: event.ticketPrice,
        organizerId: event.organizer.id,
      });

      // Store in local cache
      await this.cacheEvent(event);

      return event;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event';
      throw new Error(message);
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await api.patch(`/events/${eventId}`, eventData);
      const event = response.data;

      // Track to REZ
      await trackToREZ('event_updated', {
        eventId,
        changes: Object.keys(eventData),
      });

      return event;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update event';
      throw new Error(message);
    }
  }

  /**
   * Cancel event
   */
  async cancelEvent(eventId: string): Promise<void> {
    try {
      await api.post(`/events/${eventId}/cancel`);

      // Track to REZ
      await trackToREZ('event_cancelled', { eventId });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel event';
      throw new Error(message);
    }
  }

  /**
   * Purchase ticket
   */
  async purchaseTicket(eventId: string, quantity: number = 1): Promise<{
    ticket: Ticket;
    qrCode: string;
  }> {
    try {
      const response = await api.post('/tickets', { eventId, quantity });
      const result = response.data;

      // Track to REZ Mind
      await trackToREZ('ticket_purchased', {
        ticketId: result.ticket.id,
        eventId,
        quantity,
        amount: result.ticket.totalAmount,
      });

      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to purchase ticket';
      throw new Error(message);
    }
  }

  /**
   * Check-in with ticket
   */
  async checkIn(ticketCode: string): Promise<{ success: boolean; ticket: Ticket }> {
    try {
      const response = await api.post('/tickets/checkin', { ticketCode });
      const result = response.data;

      // Track to REZ Mind
      await trackToREZ('event_attended', {
        ticketId: result.ticket.id,
        eventId: result.ticket.event?.id,
        location: result.ticket.event?.location,
      });

      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Check-in failed';
      throw new Error(message);
    }
  }

  /**
   * Get user's tickets
   */
  async getMyTickets(): Promise<Ticket[]> {
    try {
      const response = await api.get('/tickets/user');
      return response.data.tickets;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch tickets';
      throw new Error(message);
    }
  }

  /**
   * Get ticket by code
   */
  async getTicketByCode(ticketCode: string): Promise<Ticket> {
    try {
      const response = await api.get('/tickets/code', {
        params: { code: ticketCode },
      });
      return response.data.ticket;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch ticket';
      throw new Error(message);
    }
  }

  /**
   * Cancel ticket (refund)
   */
  async cancelTicket(ticketId: string): Promise<void> {
    try {
      await api.post(`/tickets/${ticketId}/cancel`);

      // Track to REZ
      await trackToREZ('ticket_cancelled', { ticketId });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel ticket';
      throw new Error(message);
    }
  }

  /**
   * Get event predictions from REZ Mind
   */
  async getEventPredictions(eventId: string): Promise<{
    predictedAttendance: number;
    peakTime: string;
    confidence: number;
  }> {
    try {
      const response = await api.get(`/events/${eventId}/predictions`);
      return response.data.predictions;
    } catch (error) {
      // Return defaults if prediction fails
      return {
        predictedAttendance: 50,
        peakTime: '8:00 PM',
        confidence: 0.5,
      };
    }
  }

  /**
   * Share event
   */
  async shareEvent(eventId: string): Promise<void> {
    await trackToREZ('event_shared', { eventId });
  }

  /**
   * Cache event locally
   */
  private async cacheEvent(event: Event): Promise<void> {
    try {
      const key = `event_${event.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(event));
    } catch (error) {
      console.error('Failed to cache event:', error);
    }
  }

  /**
   * Get cached event
   */
  async getCachedEvent(eventId: string): Promise<Event | null> {
    try {
      const data = await AsyncStorage.getItem(`event_${eventId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get event categories
   */
  getCategories(): { id: string; label: string; icon: string }[] {
    return [
      { id: 'music', label: 'Music', icon: 'musical-notes' },
      { id: 'tech', label: 'Tech', icon: 'laptop' },
      { id: 'food', label: 'Food', icon: 'restaurant' },
      { id: 'sports', label: 'Sports', icon: 'football' },
      { id: 'arts', label: 'Arts', icon: 'color-palette' },
      { id: 'networking', label: 'Networking', icon: 'people' },
      { id: 'wellness', label: 'Wellness', icon: 'fitness' },
      { id: 'gaming', label: 'Gaming', icon: 'game-controller' },
      { id: 'education', label: 'Education', icon: 'school' },
      { id: 'nightlife', label: 'Nightlife', icon: 'moon' },
      { id: 'community', label: 'Community', icon: 'heart' },
      { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
    ];
  }
}

export const eventsService = new EventsService();
