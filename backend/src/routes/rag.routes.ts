import { Router } from 'express';
import { ragController } from '../controllers/rag.controller';
import { upload } from '../middleware/upload';


export const ragRouter = Router();

/**
 * @openapi
 * /documents/{document_id}/query:
 *   post:
 *     tags:
 *       - RAG
 *     summary: Submit a RAG query
 *     description: |
 *       Submits a natural language question to the Retrieval-Augmented Generation
 *       (RAG) pipeline. The system retrieves the most relevant analyzed documents
 *       using vector similarity search and generates an AI response from the
 *       retrieved context.
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: User's natural language question.
 *                 example: Does this chest X-ray show pneumonia?
 *               image_base64:
 *                 type: string
 *                 format: byte
 *                 description: Optional base64-encoded image to include with the question.
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
  '/documents/:document_id/query',
  upload.single('image'),   // field name the frontend must use: "image"
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
