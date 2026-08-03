import { env } from '../config/env';

interface IngestResponse {
  document_id: string;
}

interface AnalyzeResponse {
  analysis_id: string;
}

interface ExtractResponse {
  summary: string;
  entities: Array<Record<string, unknown>>;
  raw: Record<string, unknown>;
}

interface RagQueryResponse {
  answer: string;
}

async function inferenceFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${env.inference.baseUrl}${path}`, init);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Inference server error ${res.status} on ${path}: ${body}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const inferenceClient = {
  async health(): Promise<unknown> {
    return inferenceFetch('/', { method: 'GET' });
  },

  async ingestDocument(params: {
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
    saveName: string;
  }): Promise<IngestResponse> {
    const form = new FormData();
    form.append('file', new Blob([params.fileBuffer], { type: params.mimeType }), params.filename);
    form.append('save_name', params.saveName);

    return inferenceFetch<IngestResponse>('/documents/ingest', {
      method: 'POST',
      body: form,
    });
  },

  async analyzeDocument(params: { inference_document_id: string }): Promise<AnalyzeResponse> {
    return inferenceFetch<AnalyzeResponse>(
      `/documents/analyze/${encodeURIComponent(params.inference_document_id)}`,
      { method: 'POST' }
    );
  },

  async extractStructured(params: { analysis_id: string }): Promise<ExtractResponse> {
    return inferenceFetch<ExtractResponse>(
      `/documents/extract/${encodeURIComponent(params.analysis_id)}`,
      { method: 'POST' }
    );
  },

  async createEmbedding(params: { analysis_id: string }): Promise<void> {
    await inferenceFetch<void>(`/embeddings/${encodeURIComponent(params.analysis_id)}`, { method: 'POST' });
  },

  async ragQuery(params: {
    question: string;
    imageBuffer?: Buffer;
    imageFilename?: string;
    imageMimeType?: string;
  }): Promise<RagQueryResponse> {
    const form = new FormData();
    form.append('question', params.question);
    if (params.imageBuffer) {
      form.append(
        'image',
        new Blob([params.imageBuffer], { type: params.imageMimeType ?? 'image/jpeg' }),
        params.imageFilename ?? 'image.jpg'
      );
    }

    return inferenceFetch<RagQueryResponse>('/rag/query', {
      method: 'POST',
      body: form,
    });
  },

  async deleteAllDocuments(): Promise<void> {
    await inferenceFetch<void>('/documents', { method: 'DELETE' });
  },
};