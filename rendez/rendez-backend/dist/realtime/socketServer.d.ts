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
import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
export declare function attachSocketServer(httpServer: HttpServer): IOServer;
/**
 * Emit an event to all users in a plan room
 */
export declare function emitToPlan(io: IOServer, planId: string, event: string, data: unknown): void;
/**
 * Emit an event to a specific user's personal room
 */
export declare function emitToUser(io: IOServer, userId: string, event: string, data: unknown): void;
/**
 * Get the Socket.io server instance for emitting events from other parts of the app
 */
export declare function getIO(): IOServer;
/**
 * Broadcast plan updates to all participants
 * Call this from plan service when plan data changes
 */
export declare function broadcastPlanUpdate(planId: string, changes: Record<string, unknown>): void;
/**
 * Notify a specific user across all their connections
 */
export declare function notifyUser(userId: string, event: string, data: unknown): void;
//# sourceMappingURL=socketServer.d.ts.map