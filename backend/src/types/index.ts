export type DocumentStatus =
  | 'uploaded'
  | 'queued'
  | 'uploading'
  | 'analyzing'
  | 'extracting'
  | 'embedding'
  | 'querying'
  | 'ready'
  | 'failed';

export type QueryStatus = 'queued' | 'querying' | 'completed' | 'failed';

export interface DocumentRecord {
  id: string;
  original_filename: string;
  mime_type: 'image/png' | 'image/jpeg';
  size_bytes: number;
  storage_key: string;
  status: DocumentStatus;
  inference_ref_id: string | null;
  inference_analysis_id: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentAnalysis {
  document_id: string;
  summary: string;
  entities: Array<Record<string, unknown>>;
  raw: Record<string, unknown>;
  created_at: Date;
}

export interface AnalyzeTaskPayload {
  document_id: string;
}

export interface QueryJobRecord {
  id: string;
  document_id: string;
  prompt: string;
  has_image: boolean;
  status: QueryStatus;
  answer: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RagQueryRequestBody {
  prompt: string;
  document_id: string;
  image_base64?: string;
}

export interface RagQueryTaskPayload {
  query_job_id: string;
  document_id: string;
  prompt: string;
  image_base64?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}