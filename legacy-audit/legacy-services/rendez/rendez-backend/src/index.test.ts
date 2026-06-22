/**
 * Rendez Backend - Unit Tests
 * @module test
 */

import { EventService } from './services/eventService.js';
import { UserService } from './services/userService.js';
import { ChatService } from './services/chatService.js';

describe('EventService', () => {
  beforeEach(() => {
    // Reset would require module reload in real tests
  });

  describe('create', () => {
    it('should create an event', () => {
      const event = EventService.create(
        'Test Event',
        'Description',
        new Date('2026-07-01'),
        'Test Location',
        'user-123',
        50
      );

      expect(event).toBeDefined();
      expect(event.title).toBe('Test Event');
      expect(event.status).toBe('active');
      expect(event.attendees).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return event by id', () => {
      const event = EventService.create(
        'Get Test',
        'Description',
        new Date(),
        'Location',
        'user-1',
        10
      );

      const found = EventService.getById(event.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Get Test');
    });

    it('should return undefined for non-existent id', () => {
      const found = EventService.getById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('rsvp', () => {
    it('should add attendee to event', () => {
      const event = EventService.create(
        'RSVP Test',
        'Description',
        new Date(),
        'Location',
        'user-1',
        10
      );

      const rsvp = EventService.rsvp(event.id, 'user-2');
      expect(rsvp).toBeDefined();
      expect(rsvp?.status).toBe('confirmed');
    });
  });
});

describe('UserService', () => {
  describe('create', () => {
    it('should create a user', () => {
      const user = UserService.create('John Doe', 'john@example.com', ['music', 'tech']);

      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.interests).toContain('music');
    });
  });

  describe('searchByInterest', () => {
    it('should find users by interest', () => {
      UserService.create('Alice', 'alice@test.com', ['sports', 'music']);
      UserService.create('Bob', 'bob@test.com', ['music', 'movies']);

      const found = UserService.searchByInterest('music');
      expect(found).toHaveLength(2);
    });
  });
});

describe('ChatService', () => {
  describe('sendMessage', () => {
    it('should send a message', () => {
      const message = ChatService.sendMessage(
        'event-1',
        'user-1',
        'John',
        'Hello everyone!'
      );

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello everyone!');
      expect(message.eventId).toBe('event-1');
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages', () => {
      ChatService.sendMessage('event-2', 'user-1', 'Alice', 'First');
      ChatService.sendMessage('event-2', 'user-2', 'Bob', 'Second');

      const messages = ChatService.getMessages('event-2');
      expect(messages).toHaveLength(2);
    });
  });
});