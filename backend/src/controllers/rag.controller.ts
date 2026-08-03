import { NextFunction, Request, Response } from 'express';
import { ragService } from '../services/rag.service';

export const ragController = {
  async query(req: Request, res: Response, next: NextFunction) {
    try {
      const { query_job_id } = await ragService.submitQuery(req.body);
      res.status(202).json({ query_job_id, status: 'queued' });
    } catch (err) {
      next(err);
    }
  },

  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await ragService.getQueryStatus(req.params.query_job_id);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  },
};