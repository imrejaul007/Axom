"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const CloudinaryService_1 = require("../services/CloudinaryService");
const env_1 = require("../config/env");
const telemetry_1 = require("../config/telemetry");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new Error('Only images allowed'));
    },
});
// POST /api/v1/upload/photo
router.post('/photo', auth_1.rendezAuth, upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file)
            throw new errorHandler_1.AppError(400, 'No file uploaded');
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: req.user.id },
            select: { photos: true },
        });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        if (profile.photos.length >= 6)
            throw new errorHandler_1.AppError(400, 'Maximum 6 photos allowed');
        let url;
        if (env_1.env.CLOUDINARY.API_KEY) {
            const result = await (0, CloudinaryService_1.uploadProfilePhoto)(req.file.buffer, req.user.id, profile.photos.length);
            url = result.url;
        }
        else {
            // Dev fallback — no Cloudinary configured
            url = `https://ui-avatars.com/api/?name=${req.user.id}&size=800&background=e9d5ff&color=7c3aed`;
        }
        const updated = await database_1.prisma.profile.update({
            where: { id: req.user.id },
            data: { photos: { push: url } },
        });
        res.json({ url, photos: updated.photos });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/upload/photo/:index
router.delete('/photo/:index', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const idx = parseInt(req.params.index, 10);
        if (isNaN(idx))
            throw new errorHandler_1.AppError(400, 'Invalid photo index');
        const profile = await database_1.prisma.profile.findUnique({ where: { id: req.user.id }, select: { photos: true } });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        if (idx < 0 || idx >= profile.photos.length)
            throw new errorHandler_1.AppError(400, 'Invalid photo index');
        // Extract Cloudinary public_id from URL if present
        const photoUrl = profile.photos[idx];
        if (photoUrl.includes('cloudinary.com') && env_1.env.CLOUDINARY.API_KEY) {
            const publicId = photoUrl.split('/upload/')[1]?.split('.')[0];
            if (publicId) {
                await (0, CloudinaryService_1.deleteProfilePhoto)(publicId).catch((err) => {
                    telemetry_1.log.error({ err, publicId }, '[Upload] Failed to delete Cloudinary photo');
                });
            }
        }
        const photos = profile.photos.filter((_, i) => i !== idx);
        const updated = await database_1.prisma.profile.update({ where: { id: req.user.id }, data: { photos } });
        res.json({ photos: updated.photos });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
