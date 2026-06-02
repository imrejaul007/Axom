import logger from './utils/logger';

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface ConnectedUser {
  socketId: string;
  userId: string;
  area?: string;
  city?: string;
}

interface RoomSubscription {
  userId: string;
  room: string;
  subscribedAt: Date;
}

interface Location {
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private roomSubscriptions: Map<string, RoomSubscription[]> = new Map();

  constructor(httpServer: HttpServer) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
    const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      const nodeEnv = process.env.NODE_ENV || 'development';
      if (nodeEnv !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    };

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupHandlers();
    logger.info('Socket.IO server initialized');
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data: { userId: string }) => {
        this.handleAuthenticate(socket, data.userId);
      });

      // Handle location update
      socket.on('location_update', (data: Location) => {
        this.handleLocationUpdate(socket, data);
      });

      // Handle room subscription
      socket.on('subscribe', (data: { room: string }) => {
        this.handleSubscribe(socket, data.room);
      });

      // Handle room unsubscription
      socket.on('unsubscribe', (data: { room: string }) => {
        this.handleUnsubscribe(socket, data.room);
      });

      // Handle check-in notification
      socket.on('checkin_notification', (data: {
        area: string;
        checkinCount: number;
        mood?: string;
      }) => {
        this.broadcastToArea(data.area, 'checkin_update', data);
      });

      // Handle new post notification
      socket.on('new_post', (data: {
        area: string;
        postId: string;
        authorId: string;
        content: string;
      }) => {
        this.broadcastToArea(data.area, 'new_post', data);
      });

      // Handle new event notification
      socket.on('new_event', (data: {
        area: string;
        eventId: string;
        title: string;
      }) => {
        this.broadcastToArea(data.area, 'new_event', data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleAuthenticate(socket: Socket, userId: string): void {
    const connectedUser: ConnectedUser = {
      socketId: socket.id,
      userId,
    };

    this.connectedUsers.set(socket.id, connectedUser);

    socket.emit('authenticated', { success: true, socketId: socket.id });

    logger.info(`User ${userId} authenticated on socket ${socket.id}`);
  }

  private handleLocationUpdate(socket: Socket, location: Location): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    user.area = location.area;
    user.city = location.city;
    this.connectedUsers.set(socket.id, user);

    // Join area room
    if (location.area) {
      socket.join(`area:${location.area}`);
    }

    // Notify nearby users
    this.io.to(`area:${location.area}`).emit('user_nearby', {
      userId: user.userId,
      area: location.area,
    });
  }

  private handleSubscribe(socket: Socket, room: string): void {
    socket.join(room);

    if (!this.roomSubscriptions.has(socket.id)) {
      this.roomSubscriptions.set(socket.id, []);
    }

    this.roomSubscriptions.get(socket.id)!.push({
      userId: this.connectedUsers.get(socket.id)?.userId || 'anonymous',
      room,
      subscribedAt: new Date(),
    });

    socket.emit('subscribed', { room, socketId: socket.id });
    logger.info(`Socket ${socket.id} subscribed to room: ${room}`);
  }

  private handleUnsubscribe(socket: Socket, room: string): void {
    socket.leave(room);

    const subscriptions = this.roomSubscriptions.get(socket.id);
    if (subscriptions) {
      const index = subscriptions.findIndex((s) => s.room === room);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    }

    socket.emit('unsubscribed', { room });
  }

  private handleDisconnect(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      logger.info(`User ${user.userId} disconnected from socket ${socket.id}`);
    }

    this.connectedUsers.delete(socket.id);
    this.roomSubscriptions.delete(socket.id);
  }

  private broadcastToArea(area: string, event: string, data): void {
    this.io.to(`area:${area}`).emit(event, data);
  }

  // Public methods for server-to-client events

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data): void {
    this.io.emit('notification', {
      userId,
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send to all connected users
   */
  broadcast(event: string, data): void {
    this.io.emit(event, data);
  }

  /**
   * Send to users in a specific area
   */
  sendToArea(area: string, event: string, data): void {
    this.io.to(`area:${area}`).emit(event, data);
  }

  /**
   * Send to users in a specific room
   */
  sendToRoom(room: string, event: string, data): void {
    this.io.to(room).emit(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get users in an area
   */
  getUsersInArea(area: string): string[] {
    const users: string[] = [];
    this.connectedUsers.forEach((user) => {
      if (user.area === area) {
        users.push(user.userId);
      }
    });
    return users;
  }

  /**
   * Emit custom event from backend
   */
  emit(event: string, data): void {
    this.io.emit(event, data);
  }
}

export type { SocketService, Location };
