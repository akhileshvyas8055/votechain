import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { success, error } from '../utils/apiResponse';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.json(success(result, 'Login successful'));
    } catch (err: any) {
      if (err.message.includes('Invalid credentials')) {
        res.status(401).json(error(err.message, 'UNAUTHORIZED'));
      } else {
        next(err);
      }
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const refreshToken = req.body.refreshToken;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await AuthService.logout(token, refreshToken);
      }
      
      res.json(success(null, 'Logged out successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async refreshTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json(error('Refresh token required', 'BAD_REQUEST'));
      }
      
      const result = await AuthService.refreshTokens(refreshToken);
      res.json(success(result, 'Tokens refreshed'));
    } catch (err: any) {
      res.status(401).json(error(err.message, 'UNAUTHORIZED'));
    }
  }

  static async generateMachineToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { boothCode } = req.body;
      const token = await AuthService.generateMachineToken(boothCode);
      res.json(success({ token }, 'Machine token generated'));
    } catch (err) {
      next(err);
    }
  }

  static async verifyTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const { officerId, code } = req.body;
      const isValid = await AuthService.verifyTwoFactor(officerId, code);
      
      if (isValid) {
        res.json(success({ verified: true }, '2FA verified'));
      } else {
        res.status(400).json(error('Invalid 2FA code', 'INVALID_2FA'));
      }
    } catch (err) {
      next(err);
    }
  }
}
