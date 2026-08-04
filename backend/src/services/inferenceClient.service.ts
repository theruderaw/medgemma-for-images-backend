import { env } from '../config/env';

// ============================================================================
// Types matching MedGemma Inference Server API Specification (current)
// ============================================================================

export type DocumentStatus = 'uploaded' | 'analyzing' | 'ready' | 'failed';

export interface DocumentResponse {
  document_id: string;
  original_filename: string;
  stored_filename: string;
  content_type: string;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
}

export interface MedicalEntity {
  type: string;
  value: string;
  [key: string]: unknown;
}

export interface StructuredData {
  entities: MedicalEntity[];
  [key: string]: unknown;
}

export interface AnalysisResponse {
  analysis_id: string;
  document_id: string;
  raw_output: string;
  summary: string;
  structured_data: StructuredData;
  model_name: string;
  created_at: string;
}

export interface RagQueryRequest {
  prompt: string;
  image_base64?: string | null;
}

export interface RagQueryResponse {
  answer: string;
  used_chunk_ids: string[];
}

export interface EmbedTextRequest {
  text: string;
}

export interface EmbedTextResponse {
  embedding: number[];
  dim: number;
}

// Flexible input helper types for backward compatibility
export interface IngestDocumentParams {
  fileBuffer: Buffer | Uint8Array;
  filename: string;
  mimeType: string;
  saveName?: string;
}

export interface RagQueryParams {
  documentId?: string;
  inference_document_id?: string;
  prompt?: string;
  question?: string;
  image_base64?: string | null;
  imageBuffer?: Buffer;
  imageMimeType?: string;
}

// ============================================================================
// Internal Fetch Wrapper
// ============================================================================

async function inferenceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${env.inference.baseUrl}${path}`;
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Inference server error ${res.status} on ${path}: ${body}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ============================================================================
// Inference Client Implementation
// ============================================================================

export const inferenceClient = {
  /**
   * GET /health
   * Liveness check endpoint
   */
  async health(): Promise<{ status?: string } | unknown> {
    return inferenceFetch('/health', { method: 'GET' });
  },

  /**
   * POST /documents
   * Upload document (multipart form-data)
   */
  async uploadDocument(params: IngestDocumentParams): Promise<DocumentResponse> {
    const form = new FormData();
    const blob = new Blob([params.fileBuffer], { type: params.mimeType });
    form.append('file', blob, params.filename);

    return inferenceFetch<DocumentResponse>('/documents', {
      method: 'POST',
      body: form,
    });
  },

  /**
   * Alias for uploadDocument (backward compatibility)
   */
  async ingestDocument(params: IngestDocumentParams): Promise<DocumentResponse> {
    return this.uploadDocument(params);
  },

  /**
   * GET /documents
   * List all documents. The server wraps the array as { documents: [...] } —
   * this unwraps it so callers get a plain array back.
   */
  async listDocuments(): Promise<DocumentResponse[]> {
    const res = await inferenceFetch<DocumentListResponse>('/documents', { method: 'GET' });
    return res.documents;
  },

  /**
   * GET /documents/{document_id}
   * Retrieve document details
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    return inferenceFetch<DocumentResponse>(`/documents/${encodeURIComponent(documentId)}`, {
      method: 'GET',
    });
  },

  /**
   * DELETE /documents/{document_id}
   * Delete document and cascade delete analyses/chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    await inferenceFetch<void>(`/documents/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * POST /documents/{document_id}/analyze
   * Execute two-layer vision + extraction + embedding pipeline.
   * Synchronous — blocks until the full pipeline finishes.
   */
  async analyzeDocument(
    param: string | { documentId?: string; inference_document_id?: string }
  ): Promise<AnalysisResponse> {
    const id = typeof param === 'string' ? param : param.documentId || param.inference_document_id;
    if (!id) {
      throw new Error('Document ID is required for analysis');
    }
    return inferenceFetch<AnalysisResponse>(`/documents/${encodeURIComponent(id)}/analyze`, {
      method: 'POST',
    });
  },

  /**
   * GET /documents/{document_id}/analysis
   * Retrieve the stored analysis (one per document — analyses.document_id is unique)
   */
  async getAnalysis(documentId: string): Promise<AnalysisResponse> {
    return inferenceFetch<AnalysisResponse>(`/documents/${encodeURIComponent(documentId)}/analysis`, {
      method: 'GET',
    });
  },

  /**
   * POST /documents/{document_id}/query
   * Execute RAG similarity search & answer generation.
   * Returns 409 if the document has not been analyzed yet.
   */
  async ragQuery(
    documentIdOrParams: string | RagQueryParams,
    queryParams?: RagQueryRequest
  ): Promise<RagQueryResponse> {
    let documentId: string | undefined;
    let payload: RagQueryRequest;

    if (typeof documentIdOrParams === 'string') {
      documentId = documentIdOrParams;
      payload = queryParams || { prompt: '' };
    } else {
      const p = documentIdOrParams;
      documentId = p.documentId || p.inference_document_id;
      let imageBase64 = p.image_base64 || null;

      if (!imageBase64 && p.imageBuffer) {
        imageBase64 = p.imageBuffer.toString('base64');
      }

      payload = {
        prompt: p.prompt || p.question || '',
        image_base64: imageBase64,
      };
    }

    if (!documentId) {
      throw new Error('Document ID is required for RAG query');
    }

    return inferenceFetch<RagQueryResponse>(`/documents/${encodeURIComponent(documentId)}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /embeddings
   * Debug endpoint: Generate raw text embeddings
   */
  async createEmbedding(param: string | EmbedTextRequest): Promise<EmbedTextResponse> {
    const payload: EmbedTextRequest = typeof param === 'string' ? { text: param } : param;
    return inferenceFetch<EmbedTextResponse>('/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
};