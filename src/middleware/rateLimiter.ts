import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 60, // 60 requests per minute per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,

  // Use client IP as the key for rate limiting
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ip = forwarded?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    return ip;
  },

  // Skip rate limiting for specific IPs (e.g., health checks, monitoring)
  skip: (req: Request) => {
    const ip = req.socket?.remoteAddress || '';
    const whitelistedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return whitelistedIPs.includes(ip);
  },

  // Custom error message
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 60,
  },
});
