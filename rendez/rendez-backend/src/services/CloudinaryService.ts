import { Readable } from 'stream';
import { env } from '../config/env';

// Lazy-load cloudinary to avoid startup crash when env vars are missing
let _cloudinary: typeof import('cloudinary').v2 | null = null;

async function getCloudinary() {
  if (_cloudinary) return _cloudinary;
  const { v2 } = await import('cloudinary');
  v2.config({
    cloud_name: env.CLOUDINARY.CLOUD_NAME,
    api_key: env.CLOUDINARY.API_KEY,
    api_secret: env.CLOUDINARY.API_SECRET,
    secure: true,
  });
  _cloudinary = v2;
  return v2;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadProfilePhoto(
  buffer: Buffer,
  profileId: string,
  index: number,
): Promise<UploadResult> {
  const cloudinary = await getCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rendez/profiles/${profileId}`,
        public_id: `photo_${index}_${Date.now()}`,
        transformation: [
          { width: 800, height: 1000, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function deleteProfilePhoto(publicId: string): Promise<void> {
  const cloudinary = await getCloudinary();
  await cloudinary.uploader.destroy(publicId);
}
