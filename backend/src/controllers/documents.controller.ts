import { NextFunction, Request, Response } from 'express';
import { documentsService } from '../services/documents.service';
import { ApiError } from '../types';

export const documentsController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ApiError(400, 'No file uploaded (expected multipart field "file")');
      const doc = await documentsService.upload(req.file);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const docs = await documentsService.listAll();
      res.status(200).json(docs);
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { document_id } = req.body as { document_id?: string };
      if (!document_id) throw new ApiError(400, 'document_id is required');
      const doc = await documentsService.submit(document_id);
      res.status(200).json(doc);
    } catch (err) {
      next(err);
    }
  },

  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const { task_id } = await documentsService.triggerAnalysis(req.params.document_id);
      res.status(202).json({ task_id, document_id: req.params.document_id, status: 'queued' });
    } catch (err) {
      next(err);
    }
  },

  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.getStatus(req.params.document_id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async analysis(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.getAnalysis(req.params.document_id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await documentsService.remove(req.params.document_id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};  