import { Router } from 'express';
import { ragController } from '../controllers/rag.controller';
import { ragQuerySchema, validateBody } from '../middleware/validate';

export const ragRouter = Router();

/**
 * @openapi
 * /rag/query:
 *   post:
 *     tags:
 *       - RAG
 *     summary: Submit a RAG query
 *     description: |
 *       Submits a natural language question to the Retrieval-Augmented Generation
 *       (RAG) pipeline. The system retrieves the most relevant analyzed documents
 *       using vector similarity search and generates an AI response from the
 *       retrieved context.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: User's natural language question.
 *                 example: Does this chest X-ray show pneumonia?
 *               top_k:
 *                 type: integer
 *                 description: Number of relevant documents to retrieve.
 *                 default: 5
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       202:
 *         description: Query accepted for processing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query_job_id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: queued
 *       400:
 *         description: Invalid request body.
 *       500:
 *         description: Internal server error.
 */
ragRouter.post(
  '/rag/query',
  validateBody(ragQuerySchema),
  ragController.query
);

/**
 * @openapi
 * /rag/status/{query_job_id}:
 *   get:
 *     tags:
 *       - RAG
 *     summary: Get RAG query status
 *     description: |
 *       Returns the current status of a submitted RAG query. If processing has
 *       completed, the generated answer and supporting metadata are included in
 *       the response.
 *     parameters:
 *       - in: path
 *         name: query_job_id
 *         required: true
 *         description: UUID of the RAG query job.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Query status retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query_job_id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum:
 *                     - queued
 *                     - querying
 *                     - completed
 *                     - failed
 *                 answer:
 *                   type: string
 *                   nullable: true
 *                   description: Generated response when the query has completed.
 *                 sources:
 *                   type: array
 *                   description: Documents used to generate the response.
 *                   items:
 *                     type: object
 *                     properties:
 *                       document_id:
 *                         type: string
 *                         format: uuid
 *                       score:
 *                         type: number
 *                         format: float
 *       404:
 *         description: Query job not found.
 *       500:
 *         description: Internal server error.
 */
ragRouter.get(
  '/rag/status/:query_job_id',
  ragController.status
);