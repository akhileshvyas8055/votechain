import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validate';
import { LoginSchema, Verify2FASchema, MachineTokenRequestSchema } from '../utils/validators';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Officer Authentication
router.post('/login', authLimiter, validate(LoginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshTokens);
router.post('/logout', AuthController.logout);
router.post('/verify-2fa', authLimiter, validate(Verify2FASchema), AuthController.verifyTwoFactor);

// Machine Authentication (Requires at least BOOTH_OFFICER)
router.post(
  '/machine-token',
  authenticateJWT,
  requireRole('SUPER_ADMIN', 'ELECTION_COMMISSIONER', 'BOOTH_OFFICER'),
  validate(MachineTokenRequestSchema),
  AuthController.generateMachineToken
);

export default router;
