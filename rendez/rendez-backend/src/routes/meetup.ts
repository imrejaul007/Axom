import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { MeetupService } from '../services/MeetupService';
import { auditPartnerCall } from '../middleware/partnerAudit';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { captureMeetupCreated } from '../services/intentCapture.service';
import { sendBookingToRezMind } from '../services/rezMindService';

const router = Router();
const meetup = new MeetupService();

function isValidId(id: string): boolean {
  // CUID: starts with 'c', alphanumeric, ~25 chars
  // UUID: 8-4-4-4-12 hex pattern
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET /api/v1/meetup/nearby?lat=&lng=
router.get('/nearby', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ message: 'lat and lng are required numeric values' });
    const merchants = await meetup.getNearbyMerchants(lat, lng);
    res.json(merchants);
  } catch (err) { next(err); }
});

// POST /api/v1/meetup/suggest
router.post('/suggest', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { matchId } = req.body;
    if (!matchId || !isValidId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid matchId' });
    }
    const merchants = await meetup.suggestMerchants(req.user!.id, matchId);
    res.json(merchants);
  } catch (err) { next(err); }
});

// POST /api/v1/meetup/book
router.post('/book', rendezAuth, auditPartnerCall('meetup:book'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { matchId, merchantId, date, partySize } = req.body;
    if (!matchId || !merchantId || !date) {
      throw new AppError(400, 'matchId, merchantId, and date are required');
    }
    if (!isValidId(matchId)) {
      throw new AppError(400, 'Invalid matchId');
    }
    if (!isValidId(merchantId)) {
      throw new AppError(400, 'Invalid merchantId');
    }
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(400, 'date must be in YYYY-MM-DD format');
    }
    const booking = await meetup.createBooking({
      profileId: req.user!.id,
      matchId,
      merchantId,
      date,
      partySize: typeof partySize === 'number' ? partySize : 2,
    });

    // RTMN Commerce Memory: Capture meetup created intent (non-blocking)
    captureMeetupCreated({
      userId: req.user!.id,
      matchId,
      bookingId: booking.id,
      merchantId,
      date,
    }).catch((err) => logger.warn('[IntentCapture] Failed to capture meetup created', { error: err, bookingId: booking.id }));

    // REZ Mind: Send booking event
    sendBookingToRezMind({
      user_id: req.user!.id,
      booking_id: booking.id,
      service_type: 'meetup',
      merchant_id: merchantId,
    }).catch((err) => logger.warn('[REZ Mind] Booking event failed', { error: err.message }));

    res.status(201).json(booking);
  } catch (err) { next(err); }
});

// POST /api/v1/meetup/:matchId/checkin — QR scan validates meetup
router.post('/:matchId/checkin', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid matchId' });
    }
    const { bookingId, merchantId } = req.body;
    if (!bookingId || !merchantId) {
      throw new AppError(400, 'bookingId and merchantId are required');
    }
    if (!isValidId(bookingId)) {
      throw new AppError(400, 'Invalid bookingId');
    }
    if (!isValidId(merchantId)) {
      throw new AppError(400, 'Invalid merchantId');
    }
    const result = await meetup.checkin({
      profileId: req.user!.id,
      matchId: req.params.matchId,
      bookingId,
      merchantId,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/v1/meetup/:matchId/status
router.get('/:matchId/status', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid matchId' });
    }
    const status = await meetup.getMeetupStatus(req.user!.id, req.params.matchId);
    res.json(status);
  } catch (err) { next(err); }
});

export default router;
