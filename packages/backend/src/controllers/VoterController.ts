import { Request, Response, NextFunction } from 'express';
import { VoterService } from '../services/VoterService';
import { FingerprintService } from '../services/FingerprintService';
import { success, error as apiError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class VoterController {
  static async registerVoter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const officerId = req.user!.officerId;
      
      // Basic quality check before proceeding
      // Assuming req.body.fingerprintTemplateBase64 contains raw data
      const processed = FingerprintService.processFingerprintFromSDK({
        sensorType: 'STANDARD',
        templateFormat: 'RAW',
        rawData: req.body.fingerprintTemplateBase64,
        quality: 80 // Hardcoded for this demo, usually comes from SDK
      });

      if (!processed.isValid) {
        return res.status(400).json(apiError('Fingerprint quality too low', 'FINGERPRINT_QUALITY_LOW'));
      }

      // Update body with processed raw data if normalization happened
      // In this demo, we just pass the base64 string directly to the service
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
