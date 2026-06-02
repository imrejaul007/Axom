"use strict";
/**
 * Real-time chat and plan collaboration via Socket.io
 *
 * Rooms:
 *   `match:{matchId}` — both participants join on connect.
 *   `plan:{planId}` — all participants in a plan join.
 *   `user:{profileId}` — user's personal notification room.
 *
 * All events are validated against the Rendez JWT so the WS layer
 * has the same auth guarantees as the REST layer.
 *
 * Events (client → server):
 *   join_match    { matchId }
 *   leave_match   { matchId }
 *   send_message  { matchId, content, type? }
 *   typing        { matchId }
 *   stop_typing   { matchId }
 *   read_receipt  { matchId, messageId }
 *   join_plan     { planId }
 *   leave_plan    { planId }
 *   plan_typing   { planId }
 *   stop_plan_typing { planId }
 *
 * Events (server → client):
 *   new_message       Message object
 *   typing            { profileId }
 *   stop_typing       { profileId }
 *   read              { messageId, readBy }
 *   plan_updated      { planId, changes }
 *   plan_member_joined { planId, profileId }
 *   plan_member_left  { planId, profileId }
 *   user_typing       { userId, isTyping }
 *   error             { code, message }
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSocketServer = attachSocketServer;
exports.emitToPlan = emitToPlan;
exports.emitToUser = emitToUser;
exports.getIO = getIO;
exports.broadcastPlanUpdate = broadcastPlanUpdate;
exports.notifyUser = notifyUser;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const MessagingService_1 = require("../services/MessagingService");
const telemetry_1 = require("../config/telemetry");
const messagingService = new MessagingService_1.MessagingService();
// Store io instance for external access via app.get('io')
let ioInstance = null;
// Per-socket in-memory rate limiting for send_message
const msgRateLimits = new Map();
const MSG_LIMIT = 60;
const MSG_WINDOW_MS = 60 * 1000;
function attachSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            // CRIT-44-06 FIX: Use explicit allowlist instead of wildcard '*'.
            // ALLOWED_ORIGINS defaults to 'https://rendez.in,http://localhost:*' (dev + prod).
            // Set ALLOWED_ORIGINS env var to customize. Wildcard '*' is never used.
            origin: env_1.env.ALLOWED_ORIGINS,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    // ── Redis Adapter for horizontal scaling ─────────────────────────────────────────
    // Each Socket.IO instance needs its own pub/sub clients to broadcast events
    // across multiple server instances. Without this, users on instance A cannot
    // receive messages from users on instance B.
    const pubClient = redis_1.redis.duplicate();
    const subClient = redis_1.redis.duplicate();
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    telemetry_1.log.info('[SocketServer] Redis adapter configured', {
        hasPubClient: !!pubClient,
        hasSubClient: !!subClient,
    });
    // Engine-level error logging (prevents uncaught EventEmitter throws)
    io.engine.on('connection_error', (err) => {
        telemetry_1.log.error({ code: err.code, message: err.message }, '[WS] engine connection_error');
    });
    // --- Auth middleware ---
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token)
            return next(new Error('NO_TOKEN'));
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            socket.profileId = payload.sub;
            return next();
        }
        catch {
            return next(new Error('INVALID_TOKEN'));
        }
    });
    io.on('connection', (socket) => {
        // H-4 FIX: guard against missing profileId — the auth middleware sets it, but a
        // defensive check here prevents downstream null-dereference if the middleware is
        // ever bypassed (e.g. during testing with a custom handshake).
        if (!socket.profileId) {
            socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
            socket.disconnect(true);
            return;
        }
        const profileId = socket.profileId;
        telemetry_1.log.info({ profileId, socketId: socket.id }, '[WS] connected');
        socket.on('error', (err) => {
            telemetry_1.log.error({ profileId, err }, '[WS] socket error');
        });
        // --- join_match ---
        // BUG FIX: was querying initiatorId/receiverId (non-existent fields); correct fields are user1Id/user2Id
        socket.on('join_match', async ({ matchId }) => {
            try {
                const match = await database_1.prisma.match.findFirst({
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
            }
            catch (err) {
                telemetry_1.log.error({ err }, '[WS] join_match error');
                socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join match room' });
            }
        });
        // --- send_message ---
        // BUG FIX: was calling sendMessage(matchId, profileId, ...) — args were swapped; correct is sendMessage(profileId, matchId, ...)
        socket.on('send_message', async ({ matchId, content }) => {
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
            }
            catch (err) {
                const code = err instanceof Error && err.code ? err.code : 'SEND_FAILED';
                const message = err instanceof Error ? err.message : 'Failed to send message';
                socket.emit('error', { code, message });
            }
        });
        // --- typing indicators ---
        socket.on('typing', ({ matchId }) => {
            socket.to(`match:${matchId}`).emit('typing', { profileId });
        });
        socket.on('stop_typing', ({ matchId }) => {
            socket.to(`match:${matchId}`).emit('stop_typing', { profileId });
        });
        // --- read receipts ---
        // BUG FIX: Verify messageId belongs to the matchId before marking as read.
        // Without this, a malicious user could mark any message they didn't send as read
        // by providing the messageId from any match they're in.
        socket.on('read_receipt', async ({ matchId, messageId }) => {
            try {
                const message = await database_1.prisma.message.findFirst({
                    where: { id: messageId, matchId, senderId: { not: profileId } },
                });
                if (!message)
                    return; // message not found, wrong match, or self-mark — silently ignore
                await database_1.prisma.message.update({
                    where: { id: messageId },
                    data: { read: true },
                });
                socket.to(`match:${matchId}`).emit('read', { messageId, readBy: profileId });
            }
            catch (err) {
                telemetry_1.log.error({ err }, '[WS] read_receipt error');
            }
        });
        // --- Plan room events ---
        // Join a plan room for real-time plan collaboration
        socket.on('join_plan', async ({ planId }) => {
            try {
                const plan = await database_1.prisma.plan.findFirst({
                    where: {
                        id: planId,
                        participants: { some: { id: profileId } },
                    },
                });
                if (!plan) {
                    socket.emit('error', { code: 'NOT_PARTICIPANT', message: 'Plan not found or not a participant' });
                    return;
                }
                socket.join(`plan:${planId}`);
                socket.emit('plan_joined', { planId });
                // Notify other participants
                socket.to(`plan:${planId}`).emit('plan_member_joined', { planId, profileId });
                telemetry_1.log.info({ profileId, planId }, '[WS] joined plan room');
            }
            catch (err) {
                telemetry_1.log.error({ err }, '[WS] join_plan error');
                socket.emit('error', { code: 'JOIN_PLAN_FAILED', message: 'Failed to join plan room' });
            }
        });
        // Leave a plan room
        socket.on('leave_plan', ({ planId }) => {
            socket.leave(`plan:${planId}`);
            socket.to(`plan:${planId}`).emit('plan_member_left', { planId, profileId });
            telemetry_1.log.info({ profileId, planId }, '[WS] left plan room');
        });
        // Plan typing indicator
        socket.on('plan_typing', ({ planId }) => {
            socket.to(`plan:${planId}`).emit('user_typing', { userId: profileId, isTyping: true });
        });
        socket.on('stop_plan_typing', ({ planId }) => {
            socket.to(`plan:${planId}`).emit('user_typing', { userId: profileId, isTyping: false });
        });
        socket.on('disconnect', () => {
            telemetry_1.log.info({ profileId }, '[WS] disconnected');
            // Clean up rate limit state for this profile
            if (profileId)
                msgRateLimits.delete(profileId);
            // Broadcast stop_typing to all match rooms this socket was in, preventing stuck indicators
            socket.rooms.forEach((room) => {
                if (room.startsWith('match:')) {
                    socket.to(room).emit('stop_typing', { profileId });
                }
                if (room.startsWith('plan:')) {
                    socket.to(room).emit('plan_member_left', { planId: room.replace('plan:', ''), profileId });
                }
            });
        });
    });
    // Store io instance for external access
    ioInstance = io;
    return io;
}
/**
 * Emit an event to all users in a plan room
 */
function emitToPlan(io, planId, event, data) {
    io.to(`plan:${planId}`).emit(event, data);
}
/**
 * Emit an event to a specific user's personal room
 */
function emitToUser(io, userId, event, data) {
    io.to(`user:${userId}`).emit(event, data);
}
/**
 * Get the Socket.io server instance for emitting events from other parts of the app
 */
function getIO() {
    if (!ioInstance) {
        throw new Error('[SocketServer] io instance not initialized. Call attachSocketServer first.');
    }
    return ioInstance;
}
/**
 * Broadcast plan updates to all participants
 * Call this from plan service when plan data changes
 */
function broadcastPlanUpdate(planId, changes) {
    const io = getIO();
    io.to(`plan:${planId}`).emit('plan_updated', { planId, changes });
}
/**
 * Notify a specific user across all their connections
 */
function notifyUser(userId, event, data) {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
}
