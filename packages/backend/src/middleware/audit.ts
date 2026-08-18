import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { auditTrailContract, machineSigner } from '../config/blockchain';
import { logger } from '../config/logger';
import { AuthenticatedRequest } from '../types';
import { ethers } from 'ethers';

interface AuditOptions {
  action: string;
  entityType: string;
  getEntityId?: (req: AuthenticatedRequest, res: Response) => string | undefined;
  getOldValue?: (req: AuthenticatedRequest) => any;
  getNewValue?: (req: AuthenticatedRequest, res: Response) => any;
}

/**
 * Middleware factory for logging actions to DB and Blockchain AuditTrail
 */
export const auditLog = (options: AuditOptions) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Hook into res.send to capture response data
    const originalSend = res.send;
    let responseData: any;

    res.send = function (body) {
      responseData = body;
      return originalSend.apply(res, arguments as any);
    };

    res.on('finish', async () => {
      // Only log successful actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const rawOfficerId = req.user?.officerId;
          const machineId = req.machine?.machineId;
          const performedBy = rawOfficerId || machineId || 'SYSTEM';
          
          let entityId = '';
          if (options.getEntityId) {
            entityId = options.getEntityId(req, res) || '';
          } else {
            // Try to infer from params or body
            entityId = req.params.id || req.body.id || req.body.electionId || '';
          }

          const oldValue = options.getOldValue ? options.getOldValue(req) : null;
          
          let newValue = null;
          if (options.getNewValue) {
            newValue = options.getNewValue(req, res);
          } else if (responseData) {
            try {
              const parsed = JSON.parse(responseData);
              if (parsed.success && parsed.data) {
                newValue = parsed.data;
              }
            } catch (e) {
              // Not JSON
            }
          }

          // 1. Save to Database
          try {
            await prisma.auditLog.create({
              data: {
                action: options.action,
                performedBy,
                entityType: options.entityType,
                entityId,
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('user-agent'),
              },
            });
          } catch (dbErr) {
            logger.warn('Prisma auditLog create warning:', dbErr);
          }

          // 2. Log to Blockchain (non-blocking)
          // Map action string to enum index based on AuditTrail contract
          // This is a simplified mapping
          const actionEnumMap: Record<string, number> = {
            'VOTER_REGISTERED': 0,
            'VOTE_CAST': 1,
            'ELECTION_CREATED': 2,
            'ELECTION_STARTED': 3,
            'RESULTS_PUBLISHED': 9,
          };

          const actionIdx = actionEnumMap[options.action];
          
          if (actionIdx !== undefined) {
            const entityHash = ethers.keccak256(ethers.toUtf8Bytes(options.entityType + entityId));
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(newValue || {})));
            const boothId = req.machine?.boothCode || '';

            // Send to blockchain asynchronously
            auditTrailContract.logAction(actionIdx, entityHash, boothId, dataHash)
              .catch((err: any) => {
                logger.error('Failed to log audit to blockchain:', err);
              });
          }

        } catch (error) {
          logger.error('Audit logging failed:', error);
          // Do not fail the request if audit fails
        }
      }
    });

    next();
  };
};
