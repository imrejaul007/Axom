/**
 * Rendez Backend - Event Service
 * @module services/eventService
 */

import { v4 as uuidv4 } from 'uuid';
import type { RendezEvent, RSVP, ChatMessage, EventStatus } from '../types.js';

// In-memory stores
const events = new Map<string, RendezEvent>();
const rsvps = new Map<string, RSVP>();
const messages = new Map<string, ChatMessage[]>();

export class EventService {
  /**
   * Create a new event
   */
  static create(
    title: string,
    description: string,
    date: Date,
    location: string,
    createdBy: string,
    maxAttendees: number,
    tags: string[] = [],
    latitude?: number,
    longitude?: number
  ): RendezEvent {
    const event: RendezEvent = {
      id: uuidv4(),
      title,
      description,
      date,
      location,
      latitude,
      longitude,
      attendees: [],
      maxAttendees,
      createdBy,
      status: 'active',
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    events.set(event.id, event);
    return event;
  }

  /**
   * Get event by ID
   */
  static getById(id: string): RendezEvent | undefined {
    return events.get(id);
  }

  /**
   * Get all events
   */
  static getAll(): RendezEvent[] {
    return Array.from(events.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get events by user
   */
  static getByUser(userId: string): RendezEvent[] {
    return Array.from(events.values()).filter(
      (e) => e.createdBy === userId || e.attendees.includes(userId)
    );
  }

  /**
   * Get active events
   */
  static getActive(): RendezEvent[] {
    return Array.from(events.values())
      .filter((e) => e.status === 'active')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Update event
   */
  static update(
    id: string,
    updates: Partial<Pick<RendezEvent, 'title' | 'description' | 'date' | 'location' | 'maxAttendees' | 'tags' | 'status'>>
  ): RendezEvent | undefined {
    const event = events.get(id);
    if (!event) return undefined;

    const updated = { ...event, ...updates, updatedAt: new Date() };
    events.set(id, updated);
    return updated;
  }

  /**
   * Delete event
   */
  static delete(id: string): boolean {
    return events.delete(id);
  }

  /**
   * RSVP to event
   */
  static rsvp(eventId: string, userId: string): RSVP | undefined {
    const event = events.get(eventId);
    if (!event || event.attendees.length >= event.maxAttendees) return undefined;

    event.attendees.push(userId);
    event.updatedAt = new Date();

    const rsvp: RSVP = {
      id: uuidv4(),
      eventId,
      userId,
      status: 'confirmed',
      timestamp: new Date(),
    };
    rsvps.set(rsvp.id, rsvp);
    return rsvp;
  }

  /**
   * Cancel RSVP
   */
  static cancelRsvp(eventId: string, userId: string): boolean {
    const event = events.get(eventId);
    if (!event) return false;

    event.attendees = event.attendees.filter((id) => id !== userId);
    event.updatedAt = new Date();
    return true;
  }

  /**
   * Search events
   */
  static search(query: string): RendezEvent[] {
    const lower = query.toLowerCase();
    return Array.from(events.values()).filter(
      (e) =>
        e.title.toLowerCase().includes(lower) ||
        e.description.toLowerCase().includes(lower) ||
        e.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }
}