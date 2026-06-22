/**
 * Events Service - Mock implementation for BuzzLocal
 */

export interface EventOrganizer {
  id: string;
  name: string;
  verified?: boolean;
}

export interface Event {
  id: string;
  slug?: string;
  title: string;
  description: string;
  type: string;
  location: string | { latitude: number; longitude: number; address?: string; area?: string; city?: string };
  locationDetails?: string;
  startDate: Date | string;
  endDate?: Date | string;
  startTime?: string;
  endTime?: string;
  organizerId: string;
  organizerName?: string;
  organizer?: EventOrganizer;
  attendeeCount: number;
  currentAttendees?: number;
  interestedCount?: number;
  savedCount?: number;
  maxAttendees?: number;
  isRsvped: boolean;
  isInterested?: boolean;
  price?: number;
  isPaid?: boolean;
  ticketPrice?: number;
  image?: string;
  tags?: string[];
  category?: string;
  vibes?: string[];
  trending?: boolean;
  status?: string;
  predictedPeakTime?: string;
}

export interface TicketResult {
  ticket: {
    ticketCode: string;
  };
  interested: boolean;
}

export interface EventFilters {
  type?: string;
  date?: string;
  location?: string;
  category?: string;
}

export const eventsService = {
  async getEvent(id: string): Promise<Event | null> {
    return this.getEventById(id);
  },

  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Food Festival 2026',
        description: 'Annual food festival with 50+ vendors',
        type: 'festival',
        location: 'Koramangala',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organizerId: 'org1',
        organizerName: 'Bangalore Foodies',
        attendeeCount: 250,
        maxAttendees: 500,
        isRsvped: false,
        price: 0,
        tags: ['food', 'festival', 'bangalore'],
      },
      {
        id: '2',
        title: 'Tech Networking Night',
        description: 'Weekly tech networking event',
        type: 'networking',
        location: 'MG Road',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        organizerId: 'org2',
        organizerName: 'TechHub Bangalore',
        attendeeCount: 45,
        isRsvped: true,
        price: 100,
        tags: ['tech', 'networking', 'startup'],
      },
    ];
    return mockEvents;
  },

  async getEventById(id: string): Promise<Event | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === id) || null;
  },

  async expressInterest(eventId: string, _interest?: string): Promise<{ interested: boolean }> {
    return { interested: true };
  },

  async purchaseTicket(eventId: string): Promise<TicketResult> {
    return {
      ticket: { ticketCode: `TKT-${Date.now()}` },
      interested: true,
    };
  },

  async rsvpEvent(eventId: string): Promise<boolean> {
    return true;
  },

  async cancelRsvp(eventId: string): Promise<boolean> {
    return true;
  },

  async searchEvents(query: string): Promise<Event[]> {
    const events = await this.getEvents();
    return events.filter(e =>
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  async getTrendingEvents(): Promise<Event[]> {
    const events = await this.getEvents();
    return events.filter(e => e.attendeeCount > 100);
  },

  async getNearbyEvents(lat: number, lng: number): Promise<Event[]> {
    return this.getEvents();
  },
};

export default eventsService;
