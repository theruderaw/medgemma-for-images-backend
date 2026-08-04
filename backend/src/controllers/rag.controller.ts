import { NextFunction, Request, Response } from 'express';
import { ragService } from '../services/rag.service';

import { ApiError } from '../types'

export const ragController = {

  async query(req: Request, res: Response, next: NextFunction) {
    try {
      const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
      if (!prompt) throw new ApiError(400, '"prompt" is required');

      const response = await ragService.query(req.params.document_id, {
        prompt,
        image: req.file
          ? { buffer: req.file.buffer, mimeType: req.file.mimetype, originalName: req.file.originalname }
          : undefined,
      });

      res.status(200).json(response);
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


