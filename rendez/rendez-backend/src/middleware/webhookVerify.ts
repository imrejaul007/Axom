import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { RawBodyRequest } from '../types/express';

export function verifyRezWebhook(req: RawBodyRequest, res: Response, next: NextFunction) {
  const signature = req.headers['x-rez-signature'] as string;
  if (!signature) return res.status(401).json({ message: 'Missing webhook signature' });

  // rawBody is set by express.json verify callback in src/index.ts so that
  // HMAC verification uses the exact bytes received over the wire (re-serializing
  // req.body can alter non-ASCII characters or whitespace ordering).
  const rawBody = req.rawBody;
  if (!rawBody) return res.status(400).json({ message: 'Missing raw body — webhook verification unavailable' });

  const expected = crypto
    .createHmac('sha256', env.REZ.WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha256=', ''), 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    // Buffer length mismatch (malformed hex) — treat as invalid
    isValid = false;
  }

  if (!isValid) return res.status(401).json({ message: 'Invalid webhook signature' });
  next();
}
