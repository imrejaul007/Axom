/**
 * Shared Security Middleware for BuzzLocal Services
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Rate limiter for general API calls
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 writes per minute
  message: { error: 'Too many write requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment limiter (strictest)
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 payment requests per minute
  message: { error: 'Too many payment requests, please try again' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'exp://*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-api-key'],
};

// Security headers with Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.buzzlocal.app'],
      fontSrc: ["'self'", 'data:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Request logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      console.error('[REQUEST ERROR]', JSON.stringify(log));
    } else {
      console.log('[REQUEST]', JSON.stringify(log));
    }
  });

  next();
}

// Input sanitization helper
export function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

// Validate phone number (Indian format)
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
}
