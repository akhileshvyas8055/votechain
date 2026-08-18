import { Request, Response, NextFunction } from 'express';
import { ElectionService } from '../services/ElectionService';
import { success } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class ElectionController {
  static async createElection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const officerId = req.user!.officerId;
      const election = await ElectionService.createElection(req.body, officerId);
      res.status(201).json(success(election, 'Election created successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async startElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ElectionService.startElection(id);
      res.json(success(result, 'Election started successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async pauseElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await ElectionService.pauseElection(id, reason);
      res.json(success(result, 'Election paused'));
    } catch (err) {
      next(err);
    }
  }

  static async endElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ElectionService.endElection(id);
      res.json(success(result, 'Election ended'));
    } catch (err) {
      next(err);
    }
  }

  static async getActiveElections(req: Request, res: Response, next: NextFunction) {
    try {
      const elections = await ElectionService.getActiveElections();
      res.json(success(elections, 'Active elections retrieved'));
    } catch (err) {
      next(err);
    }
  }
}
