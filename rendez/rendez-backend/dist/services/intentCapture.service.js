"use strict";
/**
 * RTMN Commerce Memory: Intent Capture Service for Rendez
 * Connects Rendez social intents to cross-app commerce intelligence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.intentCaptureService = void 0;
exports.captureProfileView = captureProfileView;
exports.captureMatchReceived = captureMatchReceived;
exports.captureMatchAccepted = captureMatchAccepted;
exports.captureDatePlanned = captureDatePlanned;
exports.captureDateCompleted = captureDateCompleted;
exports.captureProfileCreated = captureProfileCreated;
exports.captureMessageSent = captureMessageSent;
exports.captureMeetupCreated = captureMeetupCreated;
exports.captureSubscriptionStarted = captureSubscriptionStarted;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const BASE_CONFIDENCE = 0.3;
const SIGNAL_WEIGHTS = {
    profile_created: 0.20,
    profile_updated: 0.10,
    profile_viewed: 0.15,
    match_received: 0.30,
    match_accepted: 0.35,
    message_sent: 0.20,
    date_planned: 0.40,
    date_completed: 0.45,
    subscription_started: 0.50,
    subscription_renewed: 0.30,
};
const APP_TYPE = 'social_dating';
// ── Capture Functions ────────────────────────────────────────────────────────
/**
 * Capture profile view intent (cross-app commerce signal)
 */
async function captureProfileView(params) {
    try {
        const intentKey = `rendez_profile_view_${params.viewedUserId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'profile_viewed',
            metadata: {
                viewedUserId: params.viewedUserId,
                intent: params.intent,
                type: 'rendez_profile_view',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture profile view', { error, params });
    }
}
/**
 * Capture match received intent
 */
async function captureMatchReceived(params) {
    try {
        const intentKey = `rendez_match_${params.matchId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'match_received',
            metadata: {
                matchId: params.matchId,
                matchedUserId: params.matchedUserId,
                intent: params.intent,
                type: 'rendez_match',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture match received', { error, params });
    }
}
/**
 * Capture match accepted intent
 */
async function captureMatchAccepted(params) {
    try {
        const intentKey = `rendez_match_accepted_${params.matchId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'match_accepted',
            metadata: {
                matchId: params.matchId,
                matchedUserId: params.matchedUserId,
                type: 'rendez_match_accepted',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture match accepted', { error, params });
    }
}
/**
 * Capture date planned intent (strong commerce signal)
 */
async function captureDatePlanned(params) {
    try {
        const intentKey = `rendez_date_planned_${params.matchId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'date_planned',
            metadata: {
                matchId: params.matchId,
                venue: params.venue,
                dateType: params.dateType,
                type: 'rendez_date_planned',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture date planned', { error, params });
    }
}
/**
 * Capture date completed intent (purchase signal for restaurants/entertainment)
 */
async function captureDateCompleted(params) {
    try {
        const intentKey = `rendez_date_completed_${params.matchId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'date_completed',
            metadata: {
                matchId: params.matchId,
                rating: params.rating,
                review: params.review,
                type: 'rendez_date_completed',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture date completed', { error, params });
    }
}
async function upsertIntent(params) {
    const signalWeight = SIGNAL_WEIGHTS[params.eventType] || 0.1;
    try {
        const existingIntent = await database_1.prisma.intent.findUnique({
            where: {
                userId_appType_intentKey: {
                    userId: params.userId,
                    appType: params.appType,
                    intentKey: params.intentKey,
                },
            },
            include: { signals: { orderBy: { capturedAt: 'desc' }, take: 10 } },
        });
        if (existingIntent) {
            const recencyMultiplier = calculateRecencyMultiplier(existingIntent.lastSeenAt);
            const newConfidence = Math.min(1.0, Math.max(0.0, Number(existingIntent.confidence) + signalWeight * recencyMultiplier));
            await database_1.prisma.intent.update({
                where: { id: existingIntent.id },
                data: { confidence: newConfidence },
            });
            await database_1.prisma.intentSignal.create({
                data: {
                    intentId: existingIntent.id,
                    eventType: params.eventType,
                    weight: signalWeight,
                    data: params.metadata,
                },
            });
        }
        else {
            const newIntent = await database_1.prisma.intent.create({
                data: {
                    userId: params.userId,
                    appType: params.appType,
                    category: params.category,
                    intentKey: params.intentKey,
                    confidence: BASE_CONFIDENCE + signalWeight,
                    status: 'ACTIVE',
                },
            });
            await database_1.prisma.intentSignal.create({
                data: {
                    intentId: newIntent.id,
                    eventType: params.eventType,
                    weight: signalWeight,
                    data: params.metadata,
                },
            });
        }
    }
    catch (error) {
        logger_1.logger.debug('[IntentCapture] Upsert failed (table may not exist)', { error });
    }
}
function calculateRecencyMultiplier(lastSeenAt) {
    const daysSince = (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.exp(-daysSince / 30);
}
/**
 * Capture profile created intent (initial profile registration)
 */
async function captureProfileCreated(params) {
    try {
        const intentKey = `rendez_profile_created_${params.profileId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'profile_created',
            metadata: {
                profileId: params.profileId,
                intent: params.intent || 'DATING',
                type: 'rendez_profile_created',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture profile created', { error, params });
    }
}
/**
 * Capture message sent intent
 */
async function captureMessageSent(params) {
    try {
        const intentKey = `rendez_message_${params.matchId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'message_sent',
            metadata: {
                matchId: params.matchId,
                messageId: params.messageId,
                type: 'rendez_message_sent',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture message sent', { error, params });
    }
}
/**
 * Capture meetup/booking created intent
 */
async function captureMeetupCreated(params) {
    try {
        const intentKey = `rendez_meetup_${params.bookingId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'date_planned',
            metadata: {
                matchId: params.matchId,
                bookingId: params.bookingId,
                merchantId: params.merchantId,
                date: params.date,
                type: 'rendez_meetup_created',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture meetup created', { error, params });
    }
}
/**
 * Capture subscription started intent
 */
async function captureSubscriptionStarted(params) {
    try {
        const intentKey = `rendez_subscription_${params.planId}`;
        await upsertIntent({
            userId: params.userId,
            appType: APP_TYPE,
            category: 'GENERAL',
            intentKey,
            eventType: 'subscription_started',
            metadata: {
                planId: params.planId,
                planName: params.planName,
                type: 'rendez_subscription_started',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[IntentCapture] Failed to capture subscription started', { error, params });
    }
}
// ── Export ─────────────────────────────────────────────────────────────────
exports.intentCaptureService = {
    captureProfileView,
    captureMatchReceived,
    captureMatchAccepted,
    captureDatePlanned,
    captureDateCompleted,
    captureProfileCreated,
    captureMessageSent,
    captureMeetupCreated,
    captureSubscriptionStarted,
};
