"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockLimiter = exports.reportLimiter = exports.likeLimiter = exports.authLimiter = exports.planApplyLimiter = exports.giftPairLimiter = exports.giftLimiter = exports.defaultLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.defaultLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
// 5 gifts per sender per day (global daily cap)
exports.giftLimiter = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { error: 'DAILY_GIFT_LIMIT', details: 'You can send up to 5 gifts per day' },
});
// 1 gift per sender–receiver pair per 5 minutes (anti-spam)
exports.giftPairLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 1,
    keyGenerator: (req) => {
        const userId = req.user?.id || 'anon';
        const receiverId = req.body?.receiverId || req.params?.receiverId || 'unknown';
        return `gift_pair:${userId}:${receiverId}`;
    },
    message: { error: 'GIFT_TOO_SOON', details: 'Please wait before sending another gift to the same person' },
    skipFailedRequests: true,
});
// Plan apply: 20 per day per user
exports.planApplyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { error: 'PLAN_APPLY_LIMIT', details: 'You can apply to a maximum of 20 plans per day' },
});
// OTP endpoint: 3 attempts per hour (was 10/15min)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'TOO_MANY_OTP_REQUESTS', details: 'Maximum 3 OTP requests per hour' },
});
// Like endpoint: 30 likes per user per day
exports.likeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => req.user?.id || req.ip || 'anon',
    message: { error: 'LIKE_LIMIT', details: 'Maximum 30 likes per day' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Report endpoint: 20 reports per user per day
exports.reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || req.ip || 'anon',
    message: { error: 'REPORT_LIMIT', details: 'Maximum 20 reports per day' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Block endpoint: 50 blocks per user per hour
exports.blockLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.user?.id || req.ip || 'anon',
    message: { error: 'BLOCK_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
});
