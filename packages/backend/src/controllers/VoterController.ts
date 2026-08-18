import { Request, Response, NextFunction } from 'express';
import { VoterService } from '../services/VoterService';
import { FingerprintService } from '../services/FingerprintService';
import { success, error as apiError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class VoterController {
  static async registerVoter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const officerId = req.user?.officerId || 'OFFICER';
      
      const voter = await VoterService.registerVoter(req.body, officerId);
      
      res.status(201).json(success({ voterId: voter.voterIdNumber }, 'Voter registered successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async verifyEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { fingerprintRawBase64, electionId } = req.body;
      
      if (!fingerprintRawBase64 || !electionId) {
        return res.status(400).json(apiError('Missing required fields', 'BAD_REQUEST'));
      }

      const isEligible = await VoterService.verifyVoterEligibility(fingerprintRawBase64, electionId);
      
      res.json(success({ isEligible }, 'Eligibility checked'));
    } catch (err) {
      next(err);
    }
  }
}
