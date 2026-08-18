import { Router } from 'express';
import { VoterController } from '../controllers/VoterController';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { RegisterVoterSchema } from '../utils/validators';
import { auditLog } from '../middleware/audit';
import { registrationLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/register',
  registrationLimiter,
  requireRole('BOOTH_OFFICER', 'ELECTION_COMMISSIONER'),
  validate(RegisterVoterSchema),
  auditLog({ 
    action: 'VOTER_REGISTERED', 
    entityType: 'Voter',
    getEntityId: (req) => req.body.voterIdNumber
  }),
  VoterController.registerVoter
);

router.post(
  '/verify-eligibility',
  requireRole('BOOTH_OFFICER', 'ELECTION_COMMISSIONER'),
  VoterController.verifyEligibility
);

export default router;
