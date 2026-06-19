/**
 * Real-time chat via Socket.io
 *
 * Rooms: `match:{matchId}` — both participants join on connect.
 * All events are validated against the Rendez JWT so the WS layer
 * has the same auth guarantees as the REST layer.
 *
 * Events (client → server):
 *   join_match    { matchId }
 *   send_message  { matchId, content, type? }
 *   typing        { matchId }
 *   stop_typing   { matchId }
 *   read_receipt  { matchId, messageId }
 *
 * Events (server → client):
 *   new_message   Message object
 *   typing        { profileId }
 *   stop_typing   { profileId }
 *   read          { messageId, readBy }
 *   error         { code, message }
 */

import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { MessagingService } from '../services/MessagingService';
import { log } from '../config/telemetry';

interface RendezSocket extends Socket {
  profileId?: string;
}

const messagingService = new MessagingService();

// Per-socket in-memory rate limiting for send_message
const msgRateLimits = new Map<string, { count: number; windowStart: number }>();
const MSG_LIMIT = 60;
const MSG_WINDOW_MS = 60 * 1000;

export function attachSocketServer(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    cors: {
      // CRIT-44-06 FIX: Use explicit allowlist instead of wildcard '*'.
      // ALLOWED_ORIGINS defaults to 'https://rendez.in,http://localhost:*' (dev + prod).
      // Set ALLOWED_ORIGINS env var to customize. Wildcard '*' is never used.
      origin: env.ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Redis Adapter for horizontal scaling ─────────────────────────────────────────
  // Each Socket.IO instance needs its own pub/sub clients to broadcast events
  // across multiple server instances. Without this, users on instance A cannot
  // receive messages from users on instance B.
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  log.info('[SocketServer] Redis adapter configured', {
    hasPubClient: !!pubClient,
    hasSubClient: !!subClient,
  });

  // Engine-level error logging (prevents uncaught EventEmitter throws)
  io.engine.on('connection_error', (err) => {
    log.error({ code: err.code, message: err.message }, '[WS] engine connection_error');
  });

  // --- Auth middleware ---
  io.use((socket: RendezSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('NO_TOKEN'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      socket.profileId = payload.sub;
      return next();
    } catch {
      return next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket: RendezSocket) => {
    // H-4 FIX: guard against missing profileId — the auth middleware sets it, but a
    // defensive check here prevents downstream null-dereference if the middleware is
    // ever bypassed (e.g. during testing with a custom handshake).
    if (!socket.profileId) {
      socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }
    const profileId = socket.profileId;
    log.info({ profileId, socketId: socket.id }, '[WS] connected');

    socket.on('error', (err) => {
      log.error({ profileId, err }, '[WS] socket error');
    });

    // --- join_match ---
    // BUG FIX: was querying initiatorId/receiverId (non-existent fields); correct fields are user1Id/user2Id
    socket.on('join_match', async ({ matchId }: { matchId: string }) => {
      try {
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            OR: [{ user1Id: profileId }, { user2Id: profileId }],
          },
        });

        if (!match) {
          socket.emit('error', { code: 'NOT_PARTICIPANT', message: 'Match not found or not your match' });
          return;
        }

        socket.join(`match:${matchId}`);
        socket.emit('joined', { matchId });
      } catch (err) {
        log.error({ err }, '[WS] join_match error');
        socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join match room' });
      }
    });

    // --- send_message ---
    // BUG FIX: was calling sendMessage(matchId, profileId, ...) — args were swapped; correct is sendMessage(profileId, matchId, ...)
    socket.on('send_message', async ({ matchId, content }: { matchId: string; content: string; type?: string }) => {
      if (!content?.trim() || content.length > 1000) {
        socket.emit('error', { message: content?.length > 1000 ? 'Message too long' : 'Empty message' });
        return;
      }

      // Per-socket message rate limit: 60 messages per minute
      const now = Date.now();
      const rl = msgRateLimits.get(profileId) || { count: 0, windowStart: now };
      if (now - rl.windowStart > MSG_WINDOW_MS) {
        rl.count = 0;
        rl.windowStart = now;
      }
      rl.count++;
      msgRateLimits.set(profileId, rl);
      if (rl.count > MSG_LIMIT) {
        socket.emit('error', { message: 'Message rate limit exceeded' });
        return;
      }

      try {
        const result = await messagingService.sendMessage(profileId, matchId, content.trim());

        // Broadcast to both participants in the room
        io.to(`match:${matchId}`).emit('new_message', result);
      } catch (err: unknown) {
        const code = err instanceof Error && (err as Error & { code?: string }).code ? (err as Error & { code?: string }).code : 'SEND_FAILED';
        const message = err instanceof Error ? err.message : 'Failed to send message';
        socket.emit('error', { code, message });
      }
    });

    // --- typing indicators ---
    socket.on('typing', ({ matchId }: { matchId: string }) => {
      socket.to(`match:${matchId}`).emit('typing', { profileId });
    });

    socket.on('stop_typing', ({ matchId }: { matchId: string }) => {
      socket.to(`match:${matchId}`).emit('stop_typing', { profileId });
    });

    // --- read receipts ---
    // BUG FIX: Verify messageId belongs to the matchId before marking as read.
    // Without this, a malicious user could mark any message they didn't send as read
    // by providing the messageId from any match they're in.
    socket.on('read_receipt', async ({ matchId, messageId }: { matchId: string; messageId: string }) => {
      try {
        const message = await prisma.message.findFirst({
          where: { id: messageId, matchId, senderId: { not: profileId } },
        });
        if (!message) return; // message not found, wrong match, or self-mark — silently ignore

        await prisma.message.update({
          where: { id: messageId },
          data: { read: true },
        });
        socket.to(`match:${matchId}`).emit('read', { messageId, readBy: profileId });
      } catch (err) {
        log.error({ err }, '[WS] read_receipt error');
      }
    });

    socket.on('disconnect', () => {
      log.info({ profileId }, '[WS] disconnected');
      // Clean up rate limit state for this profile
      if (profileId) msgRateLimits.delete(profileId);
      // Broadcast stop_typing to all match rooms this socket was in, preventing stuck indicators
      socket.rooms.forEach((room) => {
        if (room.startsWith('match:')) {
          socket.to(room).emit('stop_typing', { profileId });
        }
      });
    });
  });

  return io;
}
