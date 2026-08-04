import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid request body', details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const ragQuerySchema = z.object({
  prompt: z.string().min(1, 'prompt is required'),
  image_base64: z.string().optional(),
});
