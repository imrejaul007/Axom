import { Router, Request, Response, NextFunction } from 'express';
import { MerchantOffer } from '../models/OfferModels';

export const router = Router();

// GET /api/offers/nearby
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, area } = req.query;
    const query: any = { status: 'active', validUntil: { $gt: new Date() } };
    if (area) query['location.area'] = area;
    const offers = await MerchantOffer.find(query).sort({ discount: -1 }).limit(50);
    res.json({ success: true, offers });
  } catch (error) {
    next(error);
  }
});

// GET /api/offers/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offer = await MerchantOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    res.json({ success: true, offer });
  } catch (error) {
    next(error);
  }
});

// POST /api/offers
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const offer = new MerchantOffer({ ...req.body, merchantId: userId });
    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    next(error);
  }
});

// PUT /api/offers/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const offer = await MerchantOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.merchantId !== userId) return res.status(403).json({ error: 'Not authorized' });
    Object.assign(offer, req.body);
    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/offers/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const offer = await MerchantOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.merchantId !== userId) return res.status(403).json({ error: 'Not authorized' });
    offer.status = 'expired';
    await offer.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/offers/:id/redeem
router.post('/:id/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offer = await MerchantOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.status !== 'active') return res.status(400).json({ error: 'Offer not active' });
    if (offer.maxClaimants && offer.currentClaimants >= offer.maxClaimants) {
      return res.status(400).json({ error: 'Offer fully claimed' });
    }
    offer.currentClaimants += 1;
    await offer.save();
    res.json({ success: true, claimCode: `REDEEM-${offer._id.toString().slice(-6).toUpperCase()}` });
  } catch (error) {
    next(error);
  }
});

// GET /api/offers/merchant/:merchantId
router.get('/merchant/:merchantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offers = await MerchantOffer.find({ merchantId: req.params.merchantId }).sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (error) {
    next(error);
  }
});
