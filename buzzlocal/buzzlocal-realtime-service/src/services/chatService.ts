import { Server as SocketServer, Socket } from 'socket.io';
import { Message } from '../models/message.js';
import { Conversation } from '../models/conversation.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface ConnectedUser {
  socketId: string;
  userId: string;
  conversationIds: string[];
}

export class ChatService {
  private io: SocketServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();

  initialize(server: unknown): void {
    this.io = new SocketServer(server, {
      cors: config.socket.cors,
      pingTimeout: config.socket.pingTimeout,
      pingInterval: config.socket.pingInterval,
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('authenticate', (data: { userId: string }) => {
        this.handleAuthenticate(socket, data.userId);
      });

      socket.on('join_conversation', (data: { conversationId: string }) => {
        this.handleJoinConversation(socket, data.conversationId);
      });

      socket.on('leave_conversation', (data: { conversationId: string }) => {
        this.handleLeaveConversation(socket, data.conversationId);
      });

      socket.on('send_message', (data: { conversationId: string; senderId: string; content: string; type?: string }) => {
        this.handleSendMessage(socket, data);
      });

      socket.on('typing_start', (data: { conversationId: string; userId: string }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: { conversationId: string; userId: string }) => {
        this.handleTypingStop(socket, data);
      });

      socket.on('mark_read', (data: { conversationId: string; userId: string }) => {
        this.handleMarkRead(data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    logger.info('Socket.IO server initialized');
  }

  private handleAuthenticate(socket: Socket, userId: string): void {
    const user: ConnectedUser = {
      socketId: socket.id,
      userId,
      conversationIds: [],
    };
    this.connectedUsers.set(socket.id, user);
    socket.emit('authenticated', { success: true });
    logger.info('User authenticated', { userId, socketId: socket.id });
  }

  private handleJoinConversation(socket: Socket, conversationId: string): void {
    socket.join(`conversation:${conversationId}`);
    const user = this.connectedUsers.get(socket.id);
    if (user && !user.conversationIds.includes(conversationId)) {
      user.conversationIds.push(conversationId);
    }
    logger.info('User joined conversation', { conversationId, socketId: socket.id });
  }

  private handleLeaveConversation(socket: Socket, conversationId: string): void {
    socket.leave(`conversation:${conversationId}`);
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.conversationIds = user.conversationIds.filter(id => id !== conversationId);
    }
  }

  private async handleSendMessage(socket: Socket, data: { conversationId: string; senderId: string; content: string; type?: string }): Promise<void> {
    const message = new Message({
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      type: (data.type as 'text' | 'image' | 'video' | 'location') || 'text',
    });
    await message.save();

    // Update conversation
    await Conversation.findByIdAndUpdate(data.conversationId, { lastMessageId: message._id.toString() });

    // Broadcast to conversation
    if (this.io) {
      this.io.to(`conversation:${data.conversationId}`).emit('new_message', {
        id: message._id.toString(),
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
      });
    }

    logger.info('Message sent', { messageId: message._id, conversationId: data.conversationId });
  }

  private handleTypingStart(socket: Socket, data: { conversationId: string; userId: string }): void {
    if (this.io) {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        conversationId: data.conversationId,
        userId: data.userId,
        isTyping: true,
      });
    }
  }

  private handleTypingStop(socket: Socket, data: { conversationId: string; userId: string }): void {
    if (this.io) {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        conversationId: data.conversationId,
        userId: data.userId,
        isTyping: false,
      });
    }
  }

  private async handleMarkRead(data: { conversationId: string; userId: string }): Promise<void> {
    await Message.updateMany(
      { conversationId: data.conversationId, senderId: { $ne: data.userId }, read: false },
      { read: true }
    );

    if (this.io) {
      this.io.to(`conversation:${data.conversationId}`).emit('messages_read', {
        conversationId: data.conversationId,
        userId: data.userId,
      });
    }
  }

  private handleDisconnect(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      // Notify all conversations the user was in
      if (this.io) {
        user.conversationIds.forEach(conversationId => {
          socket.to(`conversation:${conversationId}`).emit('user_offline', {
            userId: user.userId,
          });
        });
      }
      this.connectedUsers.delete(socket.id);
    }
    logger.info('Client disconnected', { socketId: socket.id });
  }

  getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    return Message.find({ conversationId }).sort({ createdAt: -1 }).skip(offset).limit(limit);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Conversation.find({ participants: userId }).sort({ updatedAt: -1 });
  }
}

export const chatService = new ChatService();