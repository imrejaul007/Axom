import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import {
  Society,
  SocietyMember,
  Announcement,
  MaintenanceRequest,
  Visitor,
  Classified,
  SocietyEvent,
  DomesticHelp
} from '../models/SocietyModels';

const router = Router();

// Validation schemas
const societySchema = z.object({
  name: z.string().min(3),
  type: z.enum(['apartment', 'gated', 'layout', 'campus', 'society']),
  address: z.object({
    street: z.string(),
    area: z.string(),
    city: z.string(),
    pincode: z.string()
  }),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  settings: z.object({
    requireApproval: z.boolean().optional(),
    allowClassifieds: z.boolean().optional(),
    allowEvents: z.boolean().optional()
  }).optional()
});

const announcementSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10),
  priority: z.enum(['normal', 'important', 'urgent']).optional(),
  attachments: z.array(z.string()).optional(),
  isPinned: z.boolean().optional()
});

const visitorSchema = z.object({
  visitorName: z.string(),
  visitorPhone: z.string().optional(),
  purpose: z.enum(['family', 'friend', 'delivery', 'service', 'other']),
  expectedDate: z.string(),
  expectedTime: z.string().optional(),
  flatNumber: z.string(),
  notes: z.string().optional()
});

const classifiedSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  price: z.number().positive(),
  negotiable: z.boolean().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  images: z.array(z.string())
});

// Helper: Get user ID from header
function getUserId(req: Request): string {
  return req.headers['x-user-id'] as string || 'anonymous';
}

// Helper: Check if user is member
async function isMember(societyId: string, userId: string): Promise<boolean> {
  const member = await SocietyMember.findOne({ societyId, userId, isActive: true });
  return !!member;
}

// Helper: Check if user is admin
async function isAdmin(societyId: string, userId: string): Promise<boolean> {
  const society = await Society.findById(societyId);
  return society?.adminIds.includes(userId) || false;
}

// ==================== SOCIETY ROUTES ====================

// GET /api/societies - List societies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, area, search } = req.query;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (area) query['address.area'] = area;
    if (search) query.name = { $regex: search as string, $options: 'i' };

    const societies = await Society.find(query)
      .sort({ memberCount: -1 })
      .limit(50);

    res.json({ success: true, societies });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies - Create society
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = societySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const data = validation.data;

    const society = new Society({
      ...data,
      adminIds: [userId],
      memberCount: 1
    });

    await society.save();

    // Add creator as admin
    const member = new SocietyMember({
      societyId: society._id.toString(),
      userId,
      role: 'admin'
    });
    await member.save();

    res.json({ success: true, society });
  } catch (error) {
    next(error);
  }
});

// GET /api/societies/:id - Get society details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const society = await Society.findById(id);
    if (!society) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Get member count and active members
    const memberCount = await SocietyMember.countDocuments({ societyId: id, isActive: true });

    res.json({
      success: true,
      society: {
        ...society.toObject(),
        memberCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/join - Join society
router.post('/:id/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { flat, wing, inviteCode } = req.body;
    const userId = getUserId(req);

    const society = await Society.findById(id);
    if (!society) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Check if already member
    const existing = await SocietyMember.findOne({ societyId: id, userId });
    if (existing) {
      return res.status(409).json({ error: 'Already a member' });
    }

    // Determine role based on settings
    const role = society.settings.requireApproval ? 'resident' : 'resident';

    const member = new SocietyMember({
      societyId: id,
      userId,
      role,
      flat,
      wing
    });

    await member.save();

    // Update society member count
    society.memberCount += 1;
    await society.save();

    res.json({
      success: true,
      member,
      message: society.settings.requireApproval
        ? 'Join request submitted for approval'
        : 'Joined successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ANNOUNCEMENTS ====================

// GET /api/societies/:id/announcements - List announcements
router.get('/:id/announcements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const announcements = await Announcement.find({ societyId: id })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    res.json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/announcements - Create announcement
router.post('/:id/announcements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validation = announcementSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const isUserAdmin = await isAdmin(id, userId);
    const member = await SocietyMember.findOne({ societyId: id, userId });

    if (!isUserAdmin && member?.role === 'resident') {
      return res.status(403).json({ error: 'Only admins and secretaries can post announcements' });
    }

    const announcement = new Announcement({
      societyId: id,
      authorId: userId,
      authorRole: member?.role || 'resident',
      ...validation.data
    });

    await announcement.save();

    res.json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
});

// ==================== VISITORS ====================

// GET /api/societies/:id/visitors - List visitors
router.get('/:id/visitors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, status } = req.query;

    const query: Record<string, unknown> = { societyId: id };
    if (date) query.expectedDate = { $gte: new Date(date as string) };
    if (status) query.status = status;

    const visitors = await Visitor.find(query)
      .sort({ expectedDate: -1 })
      .limit(50);

    res.json({ success: true, visitors });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/visitors - Add visitor
router.post('/:id/visitors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validation = visitorSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const isMemberUser = await isMember(id, userId);

    if (!isMemberUser) {
      return res.status(403).json({ error: 'Only members can add visitors' });
    }

    const visitor = new Visitor({
      societyId: id,
      hostId: userId,
      ...validation.data,
      expectedDate: new Date(validation.data.expectedDate)
    });

    await visitor.save();

    res.json({ success: true, visitor });
  } catch (error) {
    next(error);
  }
});

// PUT /api/societies/:id/visitors/:visitorId - Update visitor status
router.put('/:id/visitors/:visitorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, visitorId } = req.params;
    const { status } = req.body;
    const userId = getUserId(req);

    const visitor = await Visitor.findById(visitorId);
    if (!visitor || visitor.societyId !== id) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Only host or security can update
    if (visitor.hostId !== userId) {
      const member = await SocietyMember.findOne({ societyId: id, userId });
      if (member?.role !== 'security' && member?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    visitor.status = status;
    if (status === 'arrived') {
      visitor.checkInTime = new Date();
    } else if (status === 'left') {
      visitor.checkOutTime = new Date();
    }

    await visitor.save();

    res.json({ success: true, visitor });
  } catch (error) {
    next(error);
  }
});

// ==================== QR PASS - MyGate Killer ====================

// POST /api/societies/:id/visitors/:visitorId/generate-qr
// Generates QR pass when resident approves visitor
router.post('/:id/visitors/:visitorId/generate-qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, visitorId } = req.params;
    const userId = getUserId(req);

    const visitor = await Visitor.findById(visitorId);
    if (!visitor || visitor.societyId !== id) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Only host can generate QR pass
    if (visitor.hostId !== userId) {
      return res.status(403).json({ error: 'Only the host can generate QR pass' });
    }

    // Generate unique token
    const qrToken = uuidv4();
    const qrValidUntil = new Date(visitor.expectedDate);
    qrValidUntil.setHours(23, 59, 59, 999); // End of expected date

    // Create QR payload
    const qrPayload = JSON.stringify({
      t: qrToken,
      v: visitorId,
      s: id,
      h: visitor.hostId,
      f: visitor.flatNumber,
      n: visitor.visitorName,
      p: visitor.purpose,
      exp: qrValidUntil.toISOString()
    });

    // Generate QR code as base64 PNG
    const qrCode = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    // Save to visitor
    visitor.qrToken = qrToken;
    visitor.qrCode = qrCode;
    visitor.qrValidUntil = qrValidUntil;
    visitor.status = 'approved';
    await visitor.save();

    res.json({
      success: true,
      visitor,
      qrPass: {
        qrCode,
        qrToken,
        validUntil: qrValidUntil,
        visitorName: visitor.visitorName,
        flatNumber: visitor.flatNumber,
        purpose: visitor.purpose
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/societies/:id/visitors/:visitorId/qr-pass
// Get the QR pass image for display
router.get('/:id/visitors/:visitorId/qr-pass', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, visitorId } = req.params;

    const visitor = await Visitor.findById(visitorId);
    if (!visitor || visitor.societyId !== id) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    if (!visitor.qrCode) {
      return res.status(404).json({ error: 'QR pass not generated yet' });
    }

    // Return QR image as data URL (base64)
    res.json({
      success: true,
      qrPass: {
        qrCode: visitor.qrCode,
        qrToken: visitor.qrToken,
        validUntil: visitor.qrValidUntil,
        visitorName: visitor.visitorName,
        flatNumber: visitor.flatNumber,
        purpose: visitor.purpose,
        status: visitor.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/visitors/verify-qr
// Guard scans QR code - verifies and checks in visitor
router.post('/:id/visitors/verify-qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { qrToken } = req.body;
    const guardId = getUserId(req);

    if (!qrToken) {
      return res.status(400).json({ error: 'QR token required' });
    }

    const visitor = await Visitor.findOne({ qrToken, societyId: id });
    if (!visitor) {
      return res.status(404).json({
        verified: false,
        error: 'Invalid QR code'
      });
    }

    // Check expiry
    if (visitor.qrValidUntil && new Date() > visitor.qrValidUntil) {
      return res.json({
        verified: false,
        error: 'QR pass has expired',
        visitorName: visitor.visitorName
      });
    }

    // Check if already used
    if (visitor.qrVerifiedAt) {
      return res.json({
        verified: false,
        error: 'QR code already used',
        visitorName: visitor.visitorName,
        usedAt: visitor.qrVerifiedAt
      });
    }

    // Mark as verified
    visitor.qrVerifiedAt = new Date();
    visitor.qrVerifiedBy = guardId;
    visitor.status = 'arrived';
    visitor.checkInTime = new Date();
    await visitor.save();

    // Get society and host details
    const society = await Society.findById(id);
    const host = await SocietyMember.findOne({ societyId: id, userId: visitor.hostId });

    res.json({
      verified: true,
      visitor: {
        name: visitor.visitorName,
        phone: visitor.visitorPhone,
        purpose: visitor.purpose,
        flatNumber: visitor.flatNumber,
        hostName: host?.name || 'Unknown',
        expectedTime: visitor.expectedTime,
        checkInTime: visitor.checkInTime,
        gateNumber: visitor.gateNumber
      },
      society: {
        name: society?.name,
        address: society?.address
      },
      message: `Welcome! ${visitor.visitorName} heading to Flat ${visitor.flatNumber}`
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/societies/:id/visitors/pending
// List pending visitor approvals for resident
router.get('/:id/visitors/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const visitors = await Visitor.find({
      societyId: id,
      hostId: userId,
      status: 'pending'
    }).sort({ expectedDate: -1 });

    res.json({ success: true, visitors });
  } catch (error) {
    next(error);
  }
});

// GET /api/societies/:id/visitors/my-visits
// List all visitors for the current user (host view)
router.get('/:id/visitors/my-visits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const visitors = await Visitor.find({
      societyId: id,
      hostId: userId
    }).sort({ createdAt: -1 });

    res.json({ success: true, visitors });
  } catch (error) {
    next(error);
  }
});

// ==================== CLASSIFIEDS ====================

// GET /api/societies/:id/classifieds - List classifieds
router.get('/:id/classifieds', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { category, status } = req.query;

    const query: Record<string, unknown> = { societyId: id };
    if (category) query.category = category;
    if (status) query.status = status;

    const classifieds = await Classified.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, classifieds });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/classifieds - Create classified
router.post('/:id/classifieds', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validation = classifiedSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const isMemberUser = await isMember(id, userId);

    if (!isMemberUser) {
      return res.status(403).json({ error: 'Only members can post classifieds' });
    }

    const classified = new Classified({
      societyId: id,
      sellerId: userId,
      ...validation.data
    });

    await classified.save();

    res.json({ success: true, classified });
  } catch (error) {
    next(error);
  }
});

// ==================== MAINTENANCE ====================

// GET /api/societies/:id/maintenance - List maintenance requests
router.get('/:id/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const query: Record<string, unknown> = { societyId: id };
    if (status) query.status = status;

    const requests = await MaintenanceRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/maintenance - Create maintenance request
router.post('/:id/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const isMemberUser = await isMember(id, userId);

    if (!isMemberUser) {
      return res.status(403).json({ error: 'Only members can create requests' });
    }

    const request = new MaintenanceRequest({
      societyId: id,
      requesterId: userId,
      ...req.body
    });

    await request.save();

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});

// ==================== EVENTS ====================

// GET /api/societies/:id/events - List events
router.get('/:id/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const events = await SocietyEvent.find({ societyId: id })
      .sort({ date: 1 })
      .limit(20);

    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/events - Create event
router.post('/:id/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const isUserAdmin = await isAdmin(id, userId);

    if (!isUserAdmin) {
      return res.status(403).json({ error: 'Only admins can create events' });
    }

    const event = new SocietyEvent({
      societyId: id,
      organizerId: userId,
      ...req.body
    });

    await event.save();

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/events/:eventId/rsvp - RSVP to event
router.post('/:id/events/:eventId/rsvp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, eventId } = req.params;
    const userId = getUserId(req);

    const event = await SocietyEvent.findById(eventId);
    if (!event || event.societyId !== id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
      await event.save();
    }

    res.json({ success: true, attendees: event.attendees.length });
  } catch (error) {
    next(error);
  }
});

// ==================== DOMESTIC HELP ====================

// GET /api/societies/:id/domestic-help - List domestic help
router.get('/:id/domestic-help', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const help = await DomesticHelp.find({ societyId: id })
      .sort({ rating: -1 })
      .limit(50);

    res.json({ success: true, help });
  } catch (error) {
    next(error);
  }
});

// POST /api/societies/:id/domestic-help - Register domestic help
router.post('/:id/domestic-help', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const help = new DomesticHelp({
      societyId: id,
      userId,
      ...req.body
    });

    await help.save();

    res.json({ success: true, help });
  } catch (error) {
    next(error);
  }
});

// ==================== MEMBERS ====================

// GET /api/societies/:id/members - List members
router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const members = await SocietyMember.find({ societyId: id, isActive: true })
      .sort({ role: 1, joinedAt: 1 })
      .limit(100);

    res.json({ success: true, members });
  } catch (error) {
    next(error);
  }
});

export { router as societyRoutes };
