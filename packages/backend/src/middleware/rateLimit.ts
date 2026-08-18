import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { error } from '../utils/apiResponse';
import { Request, Response } from 'express';

// Helper to create standardized rate limit responses
const createLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    res.status(429).json(error(message, 'RATE_LIMIT_EXCEEDED'));
  };
};

/**
 * General API rate limiter for standard endpoints.
 */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // e.g., 1 minute
  max: env.RATE_LIMIT_MAX_REQUESTS, // e.g., 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many requests. Please try again later.'),
});

/**
 * Strict rate limiter for authentication endpoints (login, 2FA).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many authentication attempts. Please try again in 15 minutes.'),
});

/**
 * Very strict rate limiter for vote casting.
 * Prevents a single machine from spamming votes.
 */
export const voteLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1, // 1 vote per second per machine
  keyGenerator: (req: Request): string => {
    // Rate limit based on machine ID instead of IP
    const machineToken = req.headers['x-machine-token'] as string;
    if (machineToken) {
      const parts = machineToken.split(':');
      if (parts[1]) return parts[1]; // machineId
    }
    return req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Voting rate limit exceeded. Please wait.'),
});

/**
 * Rate limiter for voter registration.
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 registrations per minute per booth
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Registration rate limit exceeded.'),
});
