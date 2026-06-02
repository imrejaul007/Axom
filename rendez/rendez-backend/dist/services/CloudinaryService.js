"use strict";
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
exports.uploadProfilePhoto = uploadProfilePhoto;
exports.deleteProfilePhoto = deleteProfilePhoto;
const stream_1 = require("stream");
const env_1 = require("../config/env");
// Lazy-load cloudinary to avoid startup crash when env vars are missing
let _cloudinary = null;
async function getCloudinary() {
    if (_cloudinary)
        return _cloudinary;
    const { v2 } = await Promise.resolve().then(() => __importStar(require('cloudinary')));
    v2.config({
        cloud_name: env_1.env.CLOUDINARY.CLOUD_NAME,
        api_key: env_1.env.CLOUDINARY.API_KEY,
        api_secret: env_1.env.CLOUDINARY.API_SECRET,
        secure: true,
    });
    _cloudinary = v2;
    return v2;
}
async function uploadProfilePhoto(buffer, profileId, index) {
    const cloudinary = await getCloudinary();
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: `rendez/profiles/${profileId}`,
            public_id: `photo_${index}_${Date.now()}`,
            transformation: [
                { width: 800, height: 1000, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
            overwrite: false,
        }, (error, result) => {
            if (error || !result)
                return reject(error || new Error('Upload failed'));
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
            });
        });
        const readable = new stream_1.Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}
async function deleteProfilePhoto(publicId) {
    const cloudinary = await getCloudinary();
    await cloudinary.uploader.destroy(publicId);
}
