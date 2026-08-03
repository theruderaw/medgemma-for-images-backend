import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import { env } from './config/env';
import { documentsRouter, statusRouter } from './routes/documents.routes';
import { ragRouter } from './routes/rag.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json({ limit: `${env.jsonBodyLimitMb}mb` }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use(documentsRouter);
app.use(statusRouter);
app.use(ragRouter);

// Swagger UI
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Must be last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`🚀 Server listening on http://localhost:${env.port}`);
  console.log(`📚 Swagger Docs: http://localhost:${env.port}/docs`);
});