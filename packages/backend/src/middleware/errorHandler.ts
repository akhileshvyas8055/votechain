import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { error } from '../utils/apiResponse';
import { logger } from '../config/logger';

/**
 * Global error handling middleware.
 * Catches all unhandled errors, formats them, and ensures no sensitive
 * information (like stack traces) is leaked in production.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Attach request ID for tracing if available
  const reqId = (req as any).reqId || 'unknown';
  
  // Log the error
  logger.error('Unhandled Exception:', { 
    error: err.message, 
    stack: err.stack, 
    reqId,
    path: req.path,
    method: req.method
  });

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['field'];
      return res.status(409).json(
        error(`Duplicate entry for ${target.join(', ')}`, 'CONFLICT_ERROR')
      );
    }
    // P2025: Record not found
    if (err.code === 'P2025') {
      return res.status(404).json(
        error('Record not found', 'NOT_FOUND')
      );
    }
    // P2003: Foreign key constraint failed
    if (err.code === 'P2003') {
      return res.status(400).json(
        error('Referenced record does not exist', 'FOREIGN_KEY_ERROR')
      );
    }
  }

  // Handle Ethers.js / Blockchain Errors
  if (err.code === 'CALL_EXCEPTION' || err.reason) {
    // Extract custom error name if available
    let customErrorName = 'BLOCKCHAIN_REVERT';
    
    if (err.data && err.data.data) {
      // Ethers v6 custom error parsing would go here
      // For now, use the reason string
    }

    return res.status(400).json(
      error(err.reason || 'Blockchain transaction failed', customErrorName)
    );
  }

  if (err.code === 'INSUFFICIENT_FUNDS') {
    return res.status(500).json(
      error('System error: Insufficient gas funds to process transaction', 'INSUFFICIENT_GAS')
    );
  }

  // Handle JWT Errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json(error('Invalid token', 'INVALID_TOKEN'));
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(error('Token expired', 'TOKEN_EXPIRED'));
  }

  // Default Server Error
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal Server Error' : err.message;
  
  res.status(500).json(
    error(message, 'INTERNAL_ERROR', isProduction ? undefined : err.stack)
  );
};
