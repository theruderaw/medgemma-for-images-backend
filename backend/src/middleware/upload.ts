import multer from 'multer';
import { env } from '../config/env';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only .png and .jpg/.jpeg files are allowed'));
      return;
    }
    cb(null, true);
  },
});