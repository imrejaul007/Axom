import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { uploadProfilePhoto, deleteProfilePhoto } from '../services/CloudinaryService';
import { env } from '../config/env';
import { log } from '../config/telemetry';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// POST /api/v1/upload/photo
router.post('/photo', rendezAuth, upload.single('photo'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'No file uploaded');

    const profile = await prisma.profile.findUnique({
      where: { id: req.user!.id },
      select: { photos: true },
    });
    if (!profile) throw new AppError(404, 'Profile not found');
    if (profile.photos.length >= 6) throw new AppError(400, 'Maximum 6 photos allowed');

    let url: string;

    if (env.CLOUDINARY.API_KEY) {
      const result = await uploadProfilePhoto(req.file.buffer, req.user!.id, profile.photos.length);
      url = result.url;
    } else {
      // Dev fallback — no Cloudinary configured
      url = `https://ui-avatars.com/api/?name=${req.user!.id}&size=800&background=e9d5ff&color=7c3aed`;
    }

    const updated = await prisma.profile.update({
      where: { id: req.user!.id },
      data: { photos: { push: url } },
    });

    res.json({ url, photos: updated.photos });
  } catch (err) { next(err); }
});

// DELETE /api/v1/upload/photo/:index
router.delete('/photo/:index', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx)) throw new AppError(400, 'Invalid photo index');

    const profile = await prisma.profile.findUnique({ where: { id: req.user!.id }, select: { photos: true } });
    if (!profile) throw new AppError(404, 'Profile not found');
    if (idx < 0 || idx >= profile.photos.length) throw new AppError(400, 'Invalid photo index');

    // Extract Cloudinary public_id from URL if present
    const photoUrl = profile.photos[idx];
    if (photoUrl.includes('cloudinary.com') && env.CLOUDINARY.API_KEY) {
      const publicId = photoUrl.split('/upload/')[1]?.split('.')[0];
      if (publicId) {
        await deleteProfilePhoto(publicId).catch((err: unknown) => {
          log.error({ err, publicId }, '[Upload] Failed to delete Cloudinary photo');
        });
      }
    }

    const photos = profile.photos.filter((_, i) => i !== idx);
    const updated = await prisma.profile.update({ where: { id: req.user!.id }, data: { photos } });
    res.json({ photos: updated.photos });
  } catch (err) { next(err); }
});

export default router;
