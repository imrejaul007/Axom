"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const DiscoveryService_1 = require("../services/DiscoveryService");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const discovery = new DiscoveryService_1.DiscoveryService();
const VALID_INTENTS = ['DATING', 'FRIENDSHIP', 'NETWORKING'];
const VALID_CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
router.get('/', auth_1.rendezAuth, rateLimiter_1.defaultLimiter, async (req, res, next) => {
    try {
        const { city, minAge, maxAge, intent } = req.query;
        const minAgeNum = minAge ? parseInt(minAge) : undefined;
        const maxAgeNum = maxAge ? parseInt(maxAge) : undefined;
        if ((minAgeNum !== undefined && isNaN(minAgeNum)) || (maxAgeNum !== undefined && isNaN(maxAgeNum))) {
            throw new errorHandler_1.AppError(400, 'minAge and maxAge must be integers');
        }
        if (minAgeNum !== undefined && (minAgeNum < 18 || minAgeNum > 60)) {
            throw new errorHandler_1.AppError(400, 'minAge must be between 18 and 60');
        }
        if (maxAgeNum !== undefined && (maxAgeNum < 18 || maxAgeNum > 60)) {
            throw new errorHandler_1.AppError(400, 'maxAge must be between 18 and 60');
        }
        // RD-H-02 FIX: Explicit enum validation — reject invalid intent values instead of
        // passing arbitrary strings through to Prisma (even though Prisma handles them gracefully).
        const intentVal = intent;
        const validatedIntent = intentVal && VALID_INTENTS.includes(intentVal)
            ? intentVal
            : undefined;
        // RD-M-04 FIX: Validate city param length to prevent abuse.
        const cityVal = city;
        const validatedCity = cityVal && cityVal.length <= 60 ? cityVal : undefined;
        const feed = await discovery.getFeed(req.user.id, {
            city: validatedCity,
            minAge: minAgeNum,
            maxAge: maxAgeNum,
            intent: validatedIntent,
        });
        res.json(feed);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
