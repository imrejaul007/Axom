import { Event, IEvent, EventCategory } from '../models/Event.js';
import { Ticket } from '../models/Ticket.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import axios from 'axios';

interface CreateEventData {
  title: string;
  description: string;
  category: EventCategory;
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
  organizerId: string;
  organizerName: string;
  isPaid?: boolean;
  ticketPrice?: number;
  maxAttendees?: number;
  coverImage?: string;
}

interface EventQuery {
  category?: EventCategory;
  latitude?: number;
  longitude?: number;
  radius?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export class EventService {
  /**
   * Create a new event
   */
  async createEvent(data: CreateEventData): Promise<IEvent> {
    const event = new Event({
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      organizerId: data.organizerId,
      organizerName: data.organizerName,
      isPaid: data.isPaid || false,
      ticketPrice: data.ticketPrice,
      maxAttendees: data.maxAttendees,
      coverImage: data.coverImage,
      currentAttendees: 0,
      interestedCount: 0,
      status: 'published',
    });

    await event.save();

    // Generate QR code for event
    const qrData = JSON.stringify({
      type: 'event',
      eventId: event._id.toString(),
      action: 'checkin',
    });
    event.qrCode = await QRCode.toDataURL(qrData);
    await event.save();

    // Track analytics
    this.trackAnalytics('event_created', { eventId: event._id.toString(), category: data.category });

    return event;
  }

  /**
   * Get events with filters
   */
  async getEvents(query: EventQuery): Promise<{
    events: unknown[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: unknown = { status: query.status || 'published' };

    // Category filter
    if (query.category) {
      filter.category = query.category;
    }

    // Date filter
    if (query.startDate) {
      filter.startDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      filter.startDate = {
        ...filter.startDate,
        $lte: new Date(query.endDate),
      };
    }

    // Location filter
    if (query.latitude && query.longitude && query.radius) {
      filter.locationGeo = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [query.longitude, query.latitude],
          },
          $maxDistance: query.radius,
        },
      };
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return {
      events: events.map((e) => this.transformEvent(e)),
      page,
      limit,
      total,
      hasMore: skip + events.length < total,
    };
  }

  /**
   * Get single event by ID
   */
  async getEvent(eventId: string, userId?: string): Promise<unknown> {
    const event = await Event.findById(eventId).lean();
    if (!event) {
      throw new Error('Event not found');
    }

    const transformed = this.transformEvent(event);
    transformed.isInterested = userId ? event.interestedUsers.includes(userId) : false;

    return transformed;
  }

  /**
   * Get event by slug
   */
  async getEventBySlug(slug: string): Promise<unknown> {
    const event = await Event.findOne({ slug }).lean();
    if (!event) {
      throw new Error('Event not found');
    }
    return this.transformEvent(event);
  }

  /**
   * Get trending events
   */
  async getTrendingEvents(limit: number = 10): Promise<unknown[]> {
    const events = await Event.find({
      status: 'published',
      startDate: { $gte: new Date() },
    })
      .sort({ interestedCount: -1, currentAttendees: -1 })
      .limit(limit)
      .lean();

    return events.map((e) => this.transformEvent(e));
  }

  /**
   * Get events near user
   */
  async getNearbyEvents(
    latitude: number,
    longitude: number,
    radius: number = 10000,
    limit: number = 20
  ): Promise<unknown[]> {
    const events = await Event.find({
      status: 'published',
      startDate: { $gte: new Date() },
      locationGeo: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radius,
        },
      },
    })
      .limit(limit)
      .lean();

    return events.map((e) => this.transformEvent(e));
  }

  /**
   * Express interest in an event
   */
  async expressInterest(eventId: string, userId: string): Promise<{ interested: boolean }> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const alreadyInterested = event.interestedUsers.includes(userId);
    if (alreadyInterested) {
      event.interestedUsers = event.interestedUsers.filter((id) => id !== userId);
      event.interestedCount = Math.max(0, event.interestedCount - 1);
      await event.save();
      return { interested: false };
    }

    event.interestedUsers.push(userId);
    event.interestedCount += 1;
    await event.save();

    // Track analytics
    this.trackAnalytics('event_interested', { eventId, userId });

    return { interested: true };
  }

  /**
   * Purchase ticket for event
   */
  async purchaseTicket(eventId: string, userId: string, quantity: number = 1): Promise<{
    ticket;
    qrCode: string;
  }> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'published') {
      throw new Error('Event is not available');
    }

    if (event.startDate < new Date()) {
      throw new Error('Event has already started');
    }

    if (event.maxAttendees) {
      const currentTickets = await Ticket.countDocuments({
        eventId,
        status: { $in: ['confirmed', 'checked_in'] },
      });
      if (currentTickets + quantity > event.maxAttendees) {
        throw new Error('Not enough tickets available');
      }
    }

    // Check if user already has a ticket
    const existingTicket = await Ticket.findOne({
      eventId,
      userId,
      status: { $in: ['confirmed', 'checked_in'] },
    });
    if (existingTicket) {
      throw new Error('You already have a ticket for this event');
    }

    const ticketCode = `TKT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const totalAmount = event.isPaid && event.ticketPrice
      ? event.ticketPrice * quantity
      : 0;

    const ticket = new Ticket({
      eventId,
      userId,
      quantity,
      totalAmount,
      ticketCode,
      status: totalAmount === 0 ? 'confirmed' : 'reserved',
      paymentStatus: totalAmount === 0 ? 'completed' : 'pending',
    });

    // Generate QR code for ticket
    const qrData = JSON.stringify({
      type: 'ticket',
      ticketId: ticket._id.toString(),
      ticketCode,
      eventId,
    });
    ticket.qrCode = await QRCode.toDataURL(qrData);

    await ticket.save();

    if (ticket.status === 'confirmed') {
      event.currentAttendees += quantity;
      await event.save();
    }

    // Track analytics
    this.trackAnalytics('ticket_purchased', {
      eventId,
      userId,
      amount: totalAmount,
      quantity,
    });

    return {
      ticket: {
        id: ticket._id.toString(),
        ticketCode,
        quantity,
        totalAmount,
        status: ticket.status,
        purchasedAt: ticket.purchasedAt,
      },
      qrCode: ticket.qrCode!,
    };
  }

  /**
   * Check in using ticket QR
   */
  async checkIn(ticketCode: string, scannedBy?: string): Promise<{
    success: boolean;
    event?;
    ticket?;
  }> {
    const ticket = await Ticket.findOne({ ticketCode }).populate('eventId');
    if (!ticket) {
      throw new Error('Invalid ticket');
    }

    if (ticket.status === 'checked_in') {
      throw new Error('Ticket already checked in');
    }

    if (ticket.status === 'cancelled') {
      throw new Error('Ticket has been cancelled');
    }

    ticket.status = 'checked_in';
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = scannedBy;
    await ticket.save();

    // Update event attendees
    await Event.findByIdAndUpdate(ticket.eventId, {
      $inc: { currentAttendees: ticket.quantity },
    });

    // Award coins
    this.awardCoins(ticket.userId, 30, 'event_attendance', ticket._id.toString())
      .catch(console.error);

    // Track analytics
    this.trackAnalytics('event_checkin', {
      ticketId: ticket._id.toString(),
      eventId: ticket.eventId.toString(),
      scannedBy,
    });

    return {
      success: true,
      ticket: {
        id: ticket._id.toString(),
        ticketCode: ticket.ticketCode,
        status: ticket.status,
      },
    };
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string): Promise<unknown[]> {
    const tickets = await Ticket.find({
      userId,
      status: { $ne: 'cancelled' },
    })
      .populate('eventId')
      .sort({ purchasedAt: -1 })
      .lean();

    return tickets.map((t) => ({
      id: t._id.toString(),
      ticketCode: t.ticketCode,
      quantity: t.quantity,
      totalAmount: t.totalAmount,
      status: t.status,
      purchasedAt: t.purchasedAt,
      checkedInAt: t.checkedInAt,
      event: t.eventId ? this.transformEvent(t.eventId) : null,
    }));
  }

  /**
   * Get events by organizer
   */
  async getOrganizerEvents(organizerId: string): Promise<unknown[]> {
    const events = await Event.find({ organizerId })
      .sort({ startDate: -1 })
      .lean();

    return events.map((e) => this.transformEvent(e));
  }

  /**
   * Award coins to user
   */
  private async awardCoins(
    userId: string,
    amount: number,
    reason: string,
    relatedId?: string
  ): Promise<void> {
    try {
      await axios.post(
        `${process.env.WALLET_SERVICE_URL || 'http://localhost:4002'}/wallet/earn`,
        {
          userId,
          amount,
          reason,
          relatedId,
          source: 'z_events',
        }
      );
    } catch (error) {
      console.error('Failed to award coins:', error);
    }
  }

  /**
   * Track analytics
   */
  private trackAnalytics(event: string, data): void {
    axios.post(
      `${process.env.MIND_SERVICE_URL || 'http://localhost:4005'}/events`,
      {
        eventType: event,
        source: 'z_events',
        properties: data,
        timestamp: new Date().toISOString(),
      }
    ).catch(() => {});
  }

  /**
   * Transform event for API
   */
  private transformEvent(event): unknown {
    return {
      id: event._id.toString(),
      title: event.title,
      slug: event.slug,
      description: event.description,
      coverImage: event.coverImage,
      category: event.category,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      organizer: {
        id: event.organizerId,
        name: event.organizerName,
        verified: event.organizerVerified,
      },
      isPaid: event.isPaid,
      ticketPrice: event.ticketPrice,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      interestedCount: event.interestedCount,
      savedCount: event.savedCount,
      status: event.status,
      qrCode: event.qrCode,
      checkInOpen: event.checkInOpen,
      predictedAttendance: event.predictedAttendance,
      predictedPeakTime: event.predictedPeakTime,
      createdAt: event.createdAt,
    };
  }
}

export const eventService = new EventService();
