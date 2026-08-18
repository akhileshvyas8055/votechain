import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { cacheGet } from '../config/redis';
import { AuthenticatedRequest, JWTPayload, MachineAuthPayload } from '../types';
import { OfficerRole } from '@prisma/client';
import { error } from '../utils/apiResponse';
import { logger } from '../config/logger';

/**
 * Middleware to authenticate JWT tokens for admin/officer access.
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error('Unauthorized: No token provided', 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await cacheGet(`bl_${token}`);
    if (isBlacklisted) {
      return res.status(401).json(error('Unauthorized: Token revoked', 'TOKEN_REVOKED'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json(error('Token expired', 'TOKEN_EXPIRED'));
    }
    return res.status(401).json(error('Invalid token', 'INVALID_TOKEN'));
  }
};

/**
 * Middleware to authenticate EVM machines using specialized machine tokens.
 */
export const authenticateMachine = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const machineToken = req.headers['x-machine-token'] as string;
    
    if (!machineToken) {
      return res.status(401).json(error('Unauthorized: Machine token missing', 'UNAUTHORIZED_MACHINE'));
    }

    // In a real scenario, this would be verified against the database and Redis cache
    // For now, assume format "boothCode:machineId:signature"
    const [boothCode, machineId, signature] = machineToken.split(':');
    
    if (!boothCode || !machineId || !signature) {
      return res.status(401).json(error('Invalid machine token format', 'INVALID_MACHINE_TOKEN'));
    }

    // Verify signature logic would go here
    // Verify against DB that machine is active and assigned to booth

    req.machine = { boothCode, machineId };
    
    next();
  } catch (err) {
    logger.error('Machine authentication failed:', err);
    return res.status(401).json(error('Machine authentication failed', 'MACHINE_AUTH_FAILED'));
  }
};

/**
 * Middleware to restrict access based on OfficerRole.
 * @param allowedRoles Array of allowed roles.
 */
export const requireRole = (...allowedRoles: OfficerRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(error('Unauthorized', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        error(
          'Forbidden: Insufficient permissions',
          'FORBIDDEN',
          { required: allowedRoles, current: req.user.role }
        )
      );
    }

    next();
  };
};
