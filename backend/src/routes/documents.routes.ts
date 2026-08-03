import { Router } from 'express';
import { documentsController } from '../controllers/documents.controller';
import { upload } from '../middleware/upload';

export const documentsRouter = Router();

/**
 * @openapi
 * /documents:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Upload a document
 *     description: Upload an image or PDF for later analysis.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image or PDF file.
 *     responses:
 *       201:
 *         description: Document uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document_id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: uploaded
 *       400:
 *         description: Invalid file.
 *       500:
 *         description: Internal server error.
 */
documentsRouter.post(
  '/documents',
  upload.single('file'),
  documentsController.upload
);

/**
 * @openapi
 * /documents:
 *   get:
 *     tags:
 *       - Documents
 *     summary: List all documents
 *     description: Returns every uploaded document and its metadata.
 *     responses:
 *       200:
 *         description: List of documents.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   document_id:
 *                     type: string
 *                     format: uuid
 *                   original_filename:
 *                     type: string
 *                   content_type:
 *                     type: string
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
documentsRouter.get(
  '/documents',
  documentsController.list
);

/**
 * @openapi
 * /documents/submit:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Submit a document for processing
 *     description: Queues a previously uploaded document for AI analysis.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document_id
 *             properties:
 *               document_id:
 *                 type: string
 *                 format: uuid
 *                 example: 7bff0dbe-cd0d-43ef-b7a7-f9c3d2d3d111
 *     responses:
 *       202:
 *         description: Document queued successfully.
 *       404:
 *         description: Document not found.
 */
documentsRouter.post(
  '/documents/submit',
  documentsController.submit
);

/**
 * @openapi
 * /documents/analyze/{document_id}:
 *   post:
 *     tags:
 *       - Analysis
 *     summary: Analyze a document
 *     description: Runs the AI analysis pipeline for a document immediately.
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document UUID.
 *     responses:
 *       200:
 *         description: Analysis completed successfully.
 *       404:
 *         description: Document not found.
 *       500:
 *         description: Analysis failed.
 */
documentsRouter.post(
  '/documents/analyze/:document_id',
  documentsController.analyze
);

/**
 * @openapi
 * /documents/{document_id}/analysis:
 *   get:
 *     tags:
 *       - Analysis
 *     summary: Get document analysis
 *     description: Returns the generated AI analysis for a document.
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analysis retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis_id:
 *                   type: string
 *                   format: uuid
 *                 summary:
 *                   type: string
 *                 entities:
 *                   type: array
 *                   items:
 *                     type: string
 *                 raw:
 *                   type: object
 *       404:
 *         description: Analysis not found.
 */
documentsRouter.get(
  '/documents/:document_id/analysis',
  documentsController.analysis
);

/**
 * @openapi
 * /documents/{document_id}:
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete a document
 *     description: Deletes a document together with all associated analysis data.
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Document deleted successfully.
 *       404:
 *         description: Document not found.
 */
documentsRouter.delete(
  '/documents/:document_id',
  documentsController.remove
);

export const statusRouter = Router();

/**
 * @openapi
 * /status/{document_id}:
 *   get:
 *     tags:
 *       - Status
 *     summary: Get processing status
 *     description: Returns the current processing stage of a document.
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Current processing status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document_id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum:
 *                     - uploaded
 *                     - queued
 *                     - uploading
 *                     - analyzing
 *                     - extracting
 *                     - embedding
 *                     - querying
 *                     - ready
 *                     - failed
 *       404:
 *         description: Document not found.
 */
statusRouter.get(
  '/status/:document_id',
  documentsController.status
);