"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchExpiryWorker = exports.matchExpiryQueue = void 0;
const bullmq_1 = require("bullmq");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const client_1 = require("@prisma/client");
const telemetry_1 = require("../config/telemetry");
exports.matchExpiryQueue = new bullmq_1.Queue('match-expiry', { connection: redis_1.redis });
exports.matchExpiryWorker = new bullmq_1.Worker('match-expiry', async () => {
    const expiredStates = await database_1.prisma.messageState.findMany({
        where: {
            state: { in: [client_1.ChatState.FREE_MSG_SENT, client_1.ChatState.AWAITING_REPLY] },
            expiresAt: { lte: new Date() },
        },
    });
    for (const state of expiredStates) {
        try {
            await database_1.prisma.messageState.update({
                where: { id: state.id },
                data: { state: client_1.ChatState.LOCKED },
            });
        }
        catch (err) {
            telemetry_1.log.error({ stateId: state.id, err }, '[MatchExpiry] Failed for state');
            throw err; // re-throw so BullMQ can retry
        }
    }
}, {
    connection: redis_1.redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.matchExpiryWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[MatchExpiry] Job stalled (lock expired without renewal)');
});
