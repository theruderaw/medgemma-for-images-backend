import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/document_pipeline?schema=public'),

  redis: {
    host: required('REDIS_HOST', 'localhost'),
    port: Number(process.env.REDIS_PORT ?? 6379),
  },

  storageDir: required('STORAGE_DIR', './uploads'),

  inference: {
    baseUrl: required('INFERENCE_BASE_URL', 'http://localhost:8000'),
  },

  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 20),
  jsonBodyLimitMb: Number(process.env.JSON_BODY_LIMIT_MB ?? 50),
};