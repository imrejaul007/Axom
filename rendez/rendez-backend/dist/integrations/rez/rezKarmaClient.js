"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KARMA_BADGE_MAP = void 0;
exports.getKarmaProfile = getKarmaProfile;
/**
 * ReZ Karma Service integration.
 * Fetches karma profile (trust score, level, badges) for a user by their ReZ user ID.
 * Used to surface Karma impact reputation on Rendez profiles.
 */
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
/** Known badge ID → display info mapping */
exports.KARMA_BADGE_MAP = {
    'legend': { id: 'legend', name: 'Legend', icon: '🌟' },
    'champion': { id: 'champion', name: 'Champion', icon: '🏆' },
    'volunteer': { id: 'volunteer', name: 'Volunteer', icon: '🌱' },
    'early': { id: 'early', name: 'Early', icon: '🚀' },
};
const karmaClient = axios_1.default.create({
    baseURL: env_1.env.KARMA_SERVICE_URL || 'http://localhost:3009',
    timeout: 5000,
});
/**
 * Fetch karma profile for a user by their ReZ user ID.
 * Returns null if the user has no karma profile (not yet used Karma).
 * Never throws — callers handle null gracefully.
 */
async function getKarmaProfile(rezUserId) {
    try {
        const res = await karmaClient.get(`/api/karma/user/${rezUserId}`);
        return res.data;
    }
    catch (err) {
        // 404 = no karma profile yet — not an error
        if (err.response?.status === 404)
            return null;
        // Network / timeout / 5xx — fail silently, don't break profile view
        console.warn('[rezKarmaClient] Failed to fetch karma profile:', err.message);
        return null;
    }
}
//# sourceMappingURL=rezKarmaClient.js.map