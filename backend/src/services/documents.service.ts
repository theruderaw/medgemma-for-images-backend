import { documentsRepo } from '../db/documents.repo';
import { storageService } from './storage.service';
import { inferenceClient } from '../services/inferenceClient.service';
import { analyzeQueue } from '../queue/analyzeQueue';
import { ApiError, DocumentAnalysis, DocumentRecord } from '../types';

const EXT_BY_MIME: Record<string, 'png' | 'jpg'> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

export const documentsService = {
  async upload(file: Express.Multer.File): Promise<DocumentRecord> {
    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) {
      throw new ApiError(415, 'Only .png and .jpg/.jpeg files are allowed');
    }

    const storageKey = await storageService.save(file.buffer, ext);

    return documentsRepo.create({
      original_filename: file.originalname,
      mime_type: file.mimetype as 'image/png' | 'image/jpeg',
      size_bytes: file.size,
      storage_key: storageKey,
    });
  },

  async listAll(): Promise<DocumentRecord[]> {
    return documentsRepo.listAll();
  },

  async submit(documentId: string): Promise<DocumentRecord> {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');
    if (doc.inference_ref_id) return doc;

    const fileBuffer = await storageService.read(doc.storage_key);
    // NOTE: the inference server's DocumentResponse uses `document_id`, not `id`.
    const { document_id: inferenceDocumentId } = await inferenceClient.ingestDocument({
      fileBuffer,
      filename: doc.original_filename,
      mimeType: doc.mime_type,
      saveName: doc.storage_key,
    });

    const updated = await documentsRepo.setInferenceRef(doc.id, inferenceDocumentId);
    if (!updated) throw new ApiError(404, 'Document not found');
    return updated;
  },

  async analyze(documentId: string): Promise<any> {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');
    if (!doc.inference_ref_id) {
      throw new ApiError(409, 'Document must be submitted via POST /documents/submit before analysis');
    }
    if (doc.status === 'analyzing' || doc.status === 'queued') {
      throw new ApiError(409, `Document is already being processed (status: ${doc.status})`);
    }

    await documentsRepo.setStatus(documentId, 'analyzing');

    try {
      const analysisResponse = await inferenceClient.analyzeDocument(doc.inference_ref_id);

      await documentsRepo.setInferenceAnalysisId(documentId, analysisResponse.analysis_id);
      await documentsRepo.saveAnalysis({
        document_id: documentId,
        summary: analysisResponse.summary,
        entities: analysisResponse.structured_data?.entities || [],
        raw: analysisResponse.raw_output,
      });

      await documentsRepo.setStatus(documentId, 'ready');
      return analysisResponse;
    } catch (err: any) {
      await documentsRepo.setStatus(documentId, 'failed', err.message || 'Analysis failed');
      throw err;
    }
  },

  async getStatus(documentId: string): Promise<{ document_id: string; status: string; error_message: string | null }> {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');
    return { document_id: doc.id, status: doc.status, error_message: doc.error_message };
  },

  async getAnalysis(documentId: string): Promise<DocumentAnalysis> {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');

    const analysis = await documentsRepo.getAnalysis(documentId);
    if (!analysis) throw new ApiError(404, 'Analysis not available yet for this document');
    return analysis;
  },

  async remove(documentId: string): Promise<void> {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');

    if (doc.inference_ref_id) {
      await inferenceClient.deleteDocument(doc.inference_ref_id);
    }
    await storageService.delete(doc.storage_key);
    await documentsRepo.delete(documentId);
  },
};
