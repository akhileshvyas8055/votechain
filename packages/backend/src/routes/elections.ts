import { Router } from 'express';
import { ElectionController } from '../controllers/ElectionController';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateElectionSchema } from '../utils/validators';
import { auditLog } from '../middleware/audit';

const router = Router();

// Publicly readable endpoints (if any) could go here without auth

// All below require authentication
router.use(authenticateJWT);

router.get('/', ElectionController.getAllElections);
router.get('/active', ElectionController.getActiveElections);

// Election Commission Only
router.post(
  '/',
  requireRole('ELECTION_COMMISSIONER', 'SUPER_ADMIN'),
  validate(CreateElectionSchema),
  auditLog({ action: 'ELECTION_CREATED', entityType: 'Election' }),
  ElectionController.createElection
);

router.post(
  '/:id/start',
  requireRole('ELECTION_COMMISSIONER'),
  auditLog({ action: 'ELECTION_STARTED', entityType: 'Election' }),
  ElectionController.startElection
);

router.post(
  '/:id/pause',
  requireRole('ELECTION_COMMISSIONER'),
  auditLog({ action: 'ELECTION_PAUSED', entityType: 'Election' }),
  ElectionController.pauseElection
);

router.post(
  '/:id/end',
  requireRole('ELECTION_COMMISSIONER'),
  auditLog({ action: 'ELECTION_ENDED', entityType: 'Election' }),
  ElectionController.endElection
);

export default router;
