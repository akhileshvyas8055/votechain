import { Request, Response, NextFunction } from 'express';
import { VotingService } from '../services/VotingService';
import { FingerprintService } from '../services/FingerprintService';
import { success, error as apiError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class VotingController {
  static async castVote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const machine = req.machine!;
      const { fingerprintRawBase64, candidateId, electionId } = req.body;

      // 1. Process fingerprint
      const processed = FingerprintService.processFingerprintFromSDK({
        sensorType: 'STANDARD',
        templateFormat: 'RAW',
        rawData: fingerprintRawBase64,
        quality: 80
      });

      if (!processed.isValid) {
        return res.status(400).json(apiError('Invalid fingerprint scan', 'FINGERPRINT_INVALID'));
      }

      // 2. Cast Vote
      const receipt = await VotingService.castVote(
        {
          fingerprintHash: processed.hash,
          candidateId,
          electionId
        },
        machine.boothCode
      );

      res.status(200).json(success(receipt, 'Vote cast successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async verifyVote(req: Request, res: Response, next: NextFunction) {
    try {
      const { txHash } = req.params;
      const result = await VotingService.verifyVote(txHash);
      
      if (result.verified) {
        res.json(success(result, 'Vote verified successfully'));
      } else {
        res.status(404).json(apiError(result.message, 'VERIFICATION_FAILED'));
      }
    } catch (err) {
      next(err);
    }
  }

  static async getBoothCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const machine = req.machine!;
      const { electionId } = req.params;
      const count = await VotingService.getBoothVoteCount(machine.boothCode, electionId);
      
      res.json(success({ count }, 'Booth vote count retrieved'));
    } catch (err) {
      next(err);
    }
  }
}
