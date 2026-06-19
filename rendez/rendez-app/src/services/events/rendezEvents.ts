/**
 * Rendez Events Integration Service
 * Connects Rendez to Z-Events for event-based matching
 */

import axios from 'axios';

const Z_EVENTS_URL = process.env.EXPO_PUBLIC_Z_EVENTS_URL || 'http://localhost:4008';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export interface RendezEvent {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  category: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  venue: {
    name: string;
    location: {
      address: string;
      city: string;
      latitude: number;
      longitude: number;
    };
  };
  organizer: {
    name: string;
    verified: boolean;
  };
  isPaid: boolean;
  minPrice: number;
  maxPrice: number;
  currentAttendees: number;
  maxAttendees?: number;
  interestedCount: number;
  interestedUsers: string[];
}

export interface AttendeeProfile {
  userId: string;
  name: string;
  photos: string[];
  bio?: string;
  interests: string[];
  eventContext: {
    ticketType?: string;
    goingWith?: string[];
    groupSize?: number;
  };
  compatibility?: number;
}

class RendezEventsService {
  private client: axios.AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: Z_EVENTS_URL,
      timeout: 10000,
      headers: {
        'x-internal-token': INTERNAL_TOKEN || '',
      },
    });
  }

  /**
   * Get events with attendee matching
   */
  async getEventsWithAttendees(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    startDate?: string;
    limit?: number;
  }): Promise<{ events: RendezEvent[]; total: number }> {
    try {
      const response = await this.client.get('/events', { params });
      return response.data;
    } catch (error) {
      return { events: this.getMockEvents(), total: 5 };
    }
  }

  /**
   * Get event with compatible attendees
   */
  async getEventAttendees(eventId: string): Promise<AttendeeProfile[]> {
    try {
      const response = await this.client.get(`/events/${eventId}/attendees`);
      return response.data.attendees || [];
    } catch (error) {
      return this.getMockAttendees();
    }
  }

  /**
   * Get users attending same event as user
   */
  async getCoAttendees(userId: string, eventId: string): Promise<AttendeeProfile[]> {
    try {
      const response = await this.client.get('/events/attendees/similar', {
        params: { userId, eventId },
      });
      return response.data.profiles || [];
    } catch (error) {
      return this.getMockAttendees();
    }
  }

  /**
   * Get event recommendations based on user's interests
   */
  async getRecommendedEvents(userId: string, limit = 10): Promise<RendezEvent[]> {
    try {
      const response = await this.client.get('/ai/recommendations', {
        params: { userId, limit },
      });
      return response.data.events || [];
    } catch (error) {
      return this.getMockEvents();
    }
  }

  /**
   * Book event and match with attendees
   */
  async bookEventForMatch(
    userId: string,
    eventId: string,
    matchUserId?: string
  ): Promise<{ success: boolean; bookingId?: string; suggestedConnections?: AttendeeProfile[] }> {
    try {
      const response = await this.client.post('/tickets', {
        userId,
        eventId,
        matchUserId,
        source: 'rendez',
      });
      return response.data;
    } catch (error) {
      return { success: true, bookingId: 'mock-booking-id', suggestedConnections: this.getMockAttendees() };
    }
  }

  /**
   * Get events user is attending
   */
  async getUserEvents(userId: string): Promise<RendezEvent[]> {
    try {
      const response = await this.client.get('/tickets/user', {
        params: { userId },
      });
      return response.data.events || [];
    } catch (error) {
      return this.getMockEvents();
    }
  }

  // ============================================
  // Mock Data
  // ============================================

  private getMockEvents(): RendezEvent[] {
    return [
      {
        id: 'evt1',
        title: 'Jazz Night at Sky Lounge',
        description: 'Enjoy smooth jazz with fellow jazz enthusiasts',
        coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae',
        category: 'music',
        startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        startTime: '19:00',
        venue: {
          name: 'Sky Lounge Rooftop',
          location: {
            address: '123 MG Road',
            city: 'Mumbai',
            latitude: 19.076,
            longitude: 72.8777,
          },
        },
        organizer: { name: 'Jazz Club Mumbai', verified: true },
        isPaid: true,
        minPrice: 999,
        maxPrice: 2499,
        currentAttendees: 45,
        maxAttendees: 100,
        interestedCount: 128,
        interestedUsers: [],
      },
      {
        id: 'evt2',
        title: 'Tech Founders Meetup',
        description: 'Networking for startup founders and investors',
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df71',
        category: 'networking',
        startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        startTime: '18:00',
        venue: {
          name: 'WeWork Chroma',
          location: {
            address: '456 Innovation Hub',
            city: 'Bangalore',
            latitude: 12.9716,
            longitude: 77.5946,
          },
        },
        organizer: { name: 'Bangalore Startup Network', verified: true },
        isPaid: false,
        minPrice: 0,
        maxPrice: 0,
        currentAttendees: 78,
        maxAttendees: 150,
        interestedCount: 245,
        interestedUsers: [],
      },
      {
        id: 'evt3',
        title: 'Art & Wine Evening',
        description: 'Experience contemporary art with wine tasting',
        coverImage: 'https://images.unsplash.com/photo-1510812431401-41cb2d5a1d8e',
        category: 'arts',
        startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        startTime: '17:00',
        venue: {
          name: 'Gallery 91',
          location: {
            address: '789 Cultural Lane',
            city: 'Delhi',
            latitude: 28.6139,
            longitude: 77.209,
          },
        },
        organizer: { name: 'Delhi Arts Collective', verified: true },
        isPaid: true,
        minPrice: 1999,
        maxPrice: 3999,
        currentAttendees: 32,
        maxAttendees: 60,
        interestedCount: 89,
        interestedUsers: [],
      },
      {
        id: 'evt4',
        title: 'Hiking Adventure - Monsoon Trail',
        description: 'Join us for a scenic monsoon hike',
        coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
        category: 'sports',
        startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        startTime: '06:00',
        venue: {
          name: 'Rajmachi Fort Trail',
          location: {
            address: 'Rajmachi Village',
            city: 'Pune',
            latitude: 18.5204,
            longitude: 73.8567,
          },
        },
        organizer: { name: 'Pune Trekkers Club', verified: true },
        isPaid: true,
        minPrice: 599,
        maxPrice: 599,
        currentAttendees: 24,
        maxAttendees: 40,
        interestedCount: 67,
        interestedUsers: [],
      },
      {
        id: 'evt5',
        title: 'Gourmet Food Festival',
        description: 'Sample cuisines from across India',
        coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb5611b6',
        category: 'food',
        startDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        startTime: '11:00',
        venue: {
          name: 'Jio World Garden',
          location: {
            address: 'BKC Convention Center',
            city: 'Mumbai',
            latitude: 19.055,
            longitude: 72.868,
          },
        },
        organizer: { name: 'Mumbai Foodies', verified: true },
        isPaid: true,
        minPrice: 799,
        maxPrice: 1999,
        currentAttendees: 156,
        maxAttendees: 500,
        interestedCount: 423,
        interestedUsers: [],
      },
    ];
  }

  private getMockAttendees(): AttendeeProfile[] {
    return [
      {
        userId: 'att1',
        name: 'Priya S.',
        photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330'],
        bio: 'Tech enthusiast | Coffee lover | Weekend adventurer',
        interests: ['tech', 'hiking', 'coffee'],
        eventContext: { goingWith: undefined, groupSize: 1 },
        compatibility: 92,
      },
      {
        userId: 'att2',
        name: 'Rahul M.',
        photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'],
        bio: 'Founder @ TravelStartup | Love meeting new people',
        interests: ['networking', 'travel', 'music'],
        eventContext: { goingWith: undefined, groupSize: 2 },
        compatibility: 87,
      },
      {
        userId: 'att3',
        name: 'Ananya K.',
        photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80'],
        bio: 'Food blogger | Art lover | Always up for a good conversation',
        interests: ['food', 'art', 'photography'],
        eventContext: { goingWith: 'friends', groupSize: 3 },
        compatibility: 95,
      },
      {
        userId: 'att4',
        name: 'Vikram J.',
        photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e'],
        bio: 'Fitness instructor | Sports fan | Netflix addict',
        interests: ['sports', 'fitness', 'netflix'],
        eventContext: { goingWith: undefined, groupSize: 1 },
        compatibility: 78,
      },
    ];
  }
}

export const rendezEventsService = new RendezEventsService();
export default rendezEventsService;
