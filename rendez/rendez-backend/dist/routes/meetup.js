"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const MeetupService_1 = require("../services/MeetupService");
const partnerAudit_1 = require("../middleware/partnerAudit");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const intentCapture_service_1 = require("../services/intentCapture.service");
const rezMindService_1 = require("../services/rezMindService");
const router = (0, express_1.Router)();
const meetup = new MeetupService_1.MeetupService();
function isValidId(id) {
    // CUID: starts with 'c', alphanumeric, ~25 chars
    // UUID: 8-4-4-4-12 hex pattern
    return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
// GET /api/v1/meetup/nearby?lat=&lng=
router.get('/nearby', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        if (isNaN(lat) || isNaN(lng))
            return res.status(400).json({ message: 'lat and lng are required numeric values' });
        const merchants = await meetup.getNearbyMerchants(lat, lng);
        res.json(merchants);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/meetup/suggest
router.post('/suggest', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { matchId } = req.body;
        if (!matchId || !isValidId(matchId)) {
            return res.status(400).json({ success: false, message: 'Invalid matchId' });
        }
        const merchants = await meetup.suggestMerchants(req.user.id, matchId);
        res.json(merchants);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/meetup/book
router.post('/book', auth_1.rendezAuth, (0, partnerAudit_1.auditPartnerCall)('meetup:book'), async (req, res, next) => {
    try {
        const { matchId, merchantId, date, partySize } = req.body;
        if (!matchId || !merchantId || !date) {
            throw new errorHandler_1.AppError(400, 'matchId, merchantId, and date are required');
        }
        if (!isValidId(matchId)) {
            throw new errorHandler_1.AppError(400, 'Invalid matchId');
        }
        if (!isValidId(merchantId)) {
            throw new errorHandler_1.AppError(400, 'Invalid merchantId');
        }
        if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new errorHandler_1.AppError(400, 'date must be in YYYY-MM-DD format');
        }
        const booking = await meetup.createBooking({
            profileId: req.user.id,
            matchId,
            merchantId,
            date,
            partySize: typeof partySize === 'number' ? partySize : 2,
        });
        // RTMN Commerce Memory: Capture meetup created intent (non-blocking)
        (0, intentCapture_service_1.captureMeetupCreated)({
            userId: req.user.id,
            matchId,
            bookingId: booking.id,
            merchantId,
            date,
        }).catch((err) => logger_1.logger.warn('[IntentCapture] Failed to capture meetup created', { error: err, bookingId: booking.id }));
        // REZ Mind: Send booking event
        (0, rezMindService_1.sendBookingToRezMind)({
            user_id: req.user.id,
            booking_id: booking.id,
            service_type: 'meetup',
            merchant_id: merchantId,
        }).catch((err) => logger_1.logger.warn('[REZ Mind] Booking event failed', { error: err.message }));
        res.status(201).json(booking);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/meetup/:matchId/checkin — QR scan validates meetup
router.post('/:matchId/checkin', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.matchId)) {
            return res.status(400).json({ success: false, message: 'Invalid matchId' });
        }
        const { bookingId, merchantId } = req.body;
        if (!bookingId || !merchantId) {
            throw new errorHandler_1.AppError(400, 'bookingId and merchantId are required');
        }
        if (!isValidId(bookingId)) {
            throw new errorHandler_1.AppError(400, 'Invalid bookingId');
        }
        if (!isValidId(merchantId)) {
            throw new errorHandler_1.AppError(400, 'Invalid merchantId');
        }
        const result = await meetup.checkin({
            profileId: req.user.id,
            matchId: req.params.matchId,
            bookingId,
            merchantId,
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/meetup/:matchId/status
router.get('/:matchId/status', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.matchId)) {
            return res.status(400).json({ success: false, message: 'Invalid matchId' });
        }
        const status = await meetup.getMeetupStatus(req.user.id, req.params.matchId);
        res.json(status);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
