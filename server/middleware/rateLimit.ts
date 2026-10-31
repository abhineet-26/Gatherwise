import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

export function createRateLimiter(maxRequests = 60, windowMs = 60 * 1000): RequestHandler {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later.',
      status: 429,
    },
  });
}
