/**
 * Rendez Backend - Types
 * @module types
 */

export interface RendezEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  latitude?: number;
  longitude?: number;
  attendees: string[];
  maxAttendees: number;
  createdBy: string;
  status: 'active' | 'cancelled' | 'completed';
  tags: string[];
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RendezUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  interests: string[];
  bio?: string;
  eventsAttended: number;
  eventsCreated: number;
  rating: number;
  verified: boolean;
  createdAt: Date;
}

export interface RSVP {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export enum EventStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum RSVPStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}