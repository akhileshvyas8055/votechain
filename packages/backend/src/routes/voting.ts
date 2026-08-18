import { Router } from 'express';
import { VotingController } from '../controllers/VotingController';
import { authenticateMachine, authenticateJWT, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CastVoteSchema } from '../utils/validators';
import { voteLimiter, generalLimiter } from '../middleware/rateLimit';
import { auditLog } from '../middleware/audit';

const router = Router();

// ==========================================
// MACHINE ENDPOINTS (EVM Interaction)
// ==========================================

router.post(
  '/cast',
  voteLimiter,
  authenticateMachine,
  validate(CastVoteSchema),
  auditLog({ 
    action: 'VOTE_CAST', 
    entityType: 'Election',
    getEntityId: (req) => req.body.electionId
  }),
  VotingController.castVote
);

// ==========================================
// PUBLIC/OFFICER ENDPOINTS
// ==========================================

router.get(
  '/verify/:txHash',
  generalLimiter,
  VotingController.verifyVote
);

router.get(
  '/booth-count/:electionId',
  authenticateMachine,
  VotingController.getBoothCount
);

export default router;
