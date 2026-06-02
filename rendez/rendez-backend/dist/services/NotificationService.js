"use strict";
/**
 * NotificationService
 *
 * FCM data payloads are aligned with useDeepLink in the Rendez app:
 *   match   → { type, matchId, matchName }   → navigates to Chat
 *   message → { type, matchId, matchName }   → navigates to Chat
 *   gift    → { type, giftId }               → navigates to Gift Inbox
 *   meetup  → { type, matchId }              → navigates to Meetup screen
 *   reward  → { type }                       → navigates to Profile (wallet)
 *
 * C-2 FIX: Migrated from legacy FCM HTTP v1 (fcm.googleapis.com/fcm/send + server key)
 * to Firebase Admin SDK which uses OAuth 2.0 service account credentials and the
 * v1 messages:send endpoint. The legacy API was deprecated on June 20 2023.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const admin = __importStar(require("firebase-admin"));
const env_1 = require("../config/env");
const telemetry_1 = require("../config/telemetry");
// Initialise Firebase Admin SDK once per process.
// GOOGLE_APPLICATION_CREDENTIALS env var points to the service account JSON file.
// In production set this to the path of the downloaded service account key.
if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
                ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
                : admin.credential.applicationDefault();
            admin.initializeApp({
                credential,
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
        }
        catch (initErr) {
            telemetry_1.log.error({ initErr }, '[FCM] Firebase Admin SDK initialisation failed');
        }
    }
}
class NotificationService {
    /**
     * Check user notification preferences and send only if push is enabled.
     * Falls back to permissive (send) if preferences cannot be retrieved.
     */
    async sendWithPreferences(userId, payload) {
        if (env_1.env.NODE_ENV === 'test')
            return;
        if (!admin.apps.length)
            return;
        try {
            const prefsRaw = await Promise.resolve().then(() => __importStar(require('../config/redis'))).then(m => m.redis.get(`notif_prefs:${userId}`));
            if (prefsRaw) {
                const prefs = JSON.parse(prefsRaw);
                if (prefs.push === false) {
                    return; // User opted out of push notifications
                }
            }
        }
        catch {
            // If preferences cannot be fetched, proceed with send (permissive default)
        }
        return this.send(payload);
    }
    async send(payload) {
        if (env_1.env.NODE_ENV === 'test')
            return;
        if (!admin.apps.length) {
            telemetry_1.log.warn('[FCM] Firebase Admin SDK not initialised — skipping notification send');
            return;
        }
        try {
            // C-2 FIX: Use Firebase Admin SDK (HTTP v1 API with OAuth 2.0) instead of
            // the deprecated legacy FCM API (fcm.googleapis.com/fcm/send + server key).
            const message = {
                token: payload.to,
                notification: {
                    title: payload.notification.title,
                    body: payload.notification.body,
                },
                data: payload.data,
                android: payload.android?.priority === 'high'
                    ? { priority: 'high' }
                    : undefined,
                apns: payload.android?.priority === 'high'
                    ? { payload: { aps: { contentAvailable: true } }, headers: { 'apns-priority': '10' } }
                    : undefined,
            };
            await admin.messaging().send(message);
        }
        catch (err) {
            telemetry_1.log.error({ err }, '[FCM] Send failed');
        }
    }
    async matchCreated(user1Token, user2Token, matchId, user1Name, user2Name) {
        // RD-L-06 FIX: Catch each send individually so one failure doesn't reject the whole
        // Promise.all and propagate an unhandled rejection up to the caller.
        await Promise.allSettled([
            this.send({
                to: user1Token,
                notification: { title: "It's a Match! 💜", body: `You and ${user2Name} liked each other` },
                data: { type: 'match', matchId, matchName: user2Name },
                android: { priority: 'high' },
            }),
            this.send({
                to: user2Token,
                notification: { title: "It's a Match! 💜", body: `You and ${user1Name} liked each other` },
                data: { type: 'match', matchId, matchName: user1Name },
                android: { priority: 'high' },
            }),
        ]);
    }
    // Send a match notification to a single token.
    // Used when sending independently per user so that a missing token for one
    // user does not block the notification to the other user (BUG-R4 fix).
    async matchNotify(token, matchId, otherName) {
        await this.send({
            to: token,
            notification: { title: "It's a Match! 💜", body: `You and ${otherName} liked each other` },
            data: { type: 'match', matchId, matchName: otherName },
            android: { priority: 'high' },
        });
    }
    async messageSent(receiverToken, senderName, matchId, preview) {
        await this.send({
            to: receiverToken,
            notification: { title: senderName, body: preview.slice(0, 80) },
            data: { type: 'message', matchId, matchName: senderName },
            android: { priority: 'high' },
        });
    }
    async giftReceived(receiverToken, senderName, giftId, giftDescription) {
        await this.send({
            to: receiverToken,
            notification: { title: `${senderName} sent you a gift! 🎁`, body: giftDescription },
            data: { type: 'gift', giftId },
            android: { priority: 'high' },
        });
    }
    async giftAccepted(senderToken, receiverName, matchId) {
        await this.send({
            to: senderToken,
            notification: {
                title: `${receiverName} accepted your gift! 🎉`,
                body: 'A message slot has been unlocked. Say something!',
            },
            data: { type: 'message', matchId, matchName: receiverName },
            android: { priority: 'high' },
        });
    }
    async giftRejected(senderToken, receiverName, giftId) {
        await this.send({
            to: senderToken,
            notification: { title: 'Gift declined', body: `${receiverName} declined your gift. A full refund is on its way.` },
            data: { type: 'gift', giftId },
        });
    }
    async meetupValidated(token1, token2, matchId, merchantName) {
        const notification = {
            title: 'Meetup validated! 🎊',
            body: `Your date at ${merchantName} is confirmed. Reward coins incoming!`,
        };
        await Promise.allSettled([
            this.send({ to: token1, notification, data: { type: 'meetup', matchId }, android: { priority: 'high' } }),
            this.send({ to: token2, notification, data: { type: 'meetup', matchId }, android: { priority: 'high' } }),
        ]);
    }
    async rewardTriggered(token1, token2) {
        const notification = {
            title: 'Reward dropped! 💜',
            body: 'REZ coins have been added to your wallet',
        };
        await Promise.allSettled([
            this.send({ to: token1, notification, data: { type: 'reward' } }),
            this.send({ to: token2, notification, data: { type: 'reward' } }),
        ]);
    }
    // ── Plan notifications ──────────────────────────────────────────────────────
    async planApplied(organizerToken, applicantName, planTitle, planId) {
        await this.send({
            to: organizerToken,
            notification: { title: `${applicantName} applied to your plan`, body: planTitle },
            data: { type: 'plan_applied', planId },
            android: { priority: 'high' },
        });
    }
    async planSelected(applicantToken, organizerName, planTitle, matchId) {
        await this.send({
            to: applicantToken,
            notification: { title: `${organizerName} chose you! 🎉`, body: `You're going to "${planTitle}"` },
            data: { type: 'plan_selected', matchId },
            android: { priority: 'high' },
        });
    }
    async planExpired(organizerToken, planTitle, hadApplicants) {
        const body = hadApplicants
            ? 'No one was selected — a REZ credit has been added to your account'
            : 'No applications received — a full refund is on its way';
        await this.send({
            to: organizerToken,
            notification: { title: `Your plan expired: "${planTitle}"`, body },
            data: { type: 'plan_expired' },
        });
    }
    async planGhostAlert(organizerToken, ghostName, planTitle, planId) {
        await this.send({
            to: organizerToken,
            notification: {
                title: `${ghostName} hasn't confirmed yet`,
                body: `You can pick someone else for "${planTitle}"`,
            },
            data: { type: 'plan_ghost', planId },
            android: { priority: 'high' },
        });
    }
    // ── Chat request notifications (Sprint 12) ─────────────────────────────────
    async messageRequest(receiverToken, requestId, preview) {
        await this.send({
            to: receiverToken,
            notification: { title: 'New message request', body: `"${preview}..."` },
            data: { type: 'message_request', requestId },
            android: { priority: 'high' },
        });
    }
    async messageRequestAccepted(senderToken, matchId) {
        await this.send({
            to: senderToken,
            notification: { title: 'Request accepted! 💬', body: 'They accepted your message — start chatting!' },
            data: { type: 'message', matchId },
            android: { priority: 'high' },
        });
    }
    async messageRequestDeclined(senderToken) {
        await this.send({
            to: senderToken,
            notification: { title: 'Request declined', body: 'Your message request was not accepted.' },
            data: { type: 'request_declined' },
        });
    }
    async rewardFailed(token1, token2) {
        const notification = {
            title: 'Reward not granted',
            body: 'Your meetup reward could not be processed. Contact support if you believe this is an error.',
        };
        await Promise.allSettled([
            this.send({ to: token1, notification, data: { type: 'reward' } }),
            this.send({ to: token2, notification, data: { type: 'reward' } }),
        ]);
    }
}
exports.NotificationService = NotificationService;
