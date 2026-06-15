/**
 * Rendez Backend - Chat Service
 * @module services/chatService
 */

import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '../types.js';

// In-memory store: eventId -> messages[]
const eventMessages = new Map<string, ChatMessage[]>();

export class ChatService {
  /**
   * Send message to event chat
   */
  static sendMessage(
    eventId: string,
    userId: string,
    userName: string,
    content: string
  ): ChatMessage {
    const message: ChatMessage = {
      id: uuidv4(),
      eventId,
      userId,
      userName,
      content,
      timestamp: new Date(),
    };

    const messages = eventMessages.get(eventId) || [];
    messages.push(message);
    // Keep last 100 messages
    if (messages.length > 100) {
      messages.shift();
    }
    eventMessages.set(eventId, messages);

    return message;
  }

  /**
   * Get messages for event
   */
  static getMessages(eventId: string, limit = 50): ChatMessage[] {
    const messages = eventMessages.get(eventId) || [];
    return messages.slice(-limit);
  }

  /**
   * Delete message
   */
  static deleteMessage(eventId: string, messageId: string): boolean {
    const messages = eventMessages.get(eventId);
    if (!messages) return false;

    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return false;

    messages.splice(index, 1);
    return true;
  }
}