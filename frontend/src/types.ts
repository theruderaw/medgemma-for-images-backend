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
  created_at: string;
  updated_at: string;
}

export interface DocumentAnalysis {
  document_id: string;
  summary: string;
  entities: Array<Record<string, unknown>>;
  raw: Record<string, unknown>;
  created_at: string;
}

export interface QueryJobRecord {
  query_job_id: string;
  status: QueryStatus;
  answer: string | null;
  sources?: Array<{ document_id: string; score: number }>;
  error_message?: string | null;
}
