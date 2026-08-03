export type DocumentStatus =
    | "uploaded"
    | "queued"
    | "uploading"
    | "analyzing"
    | "extracting"
    | "embedding"
    | "querying"
    | "ready"
    | "failed"

export type QueryStatus = 'queued' | 'querying' | 'completed' | 'failed'

export interface DocumentRecord {
    id: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    storage_key: string;
    inference_ref_id: string;
    inference_analysis_id: string;
    status:DocumentStatus;
    error_message: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentAnalysis {
    document_id: string;
    summary: string;
    entities: Array<Record<string,unknown>>;
    raw: Record<string,unknown>;
    created_at: string;
}

export interface QueryJobRecord {
    id: string;
    document_id: string;
    prompt: string;
    has_image: boolean;
    status: QueryStatus;
    answer: string|null;
    error_message: string|null;
    created_at: string;
    updated_at: string;
}

export interface ApiErrorBody {
    error: string;
    details?: unknown;
}

export interface AnalysisResponse {
    task_id: string; 
    document_id: string; 
    status: string;
}

export interface DocumentStatusResponse {
    document_id: string; 
    status: DocumentStatus; 
    error_message: string | null 
}

export interface QueryHistoryEntry {
    queryJobId : string;
    prompt: string;
}

export interface UiState {
    selectedDocumentId: string | null;
    selectDocument: (id: string | null) => void;

    uploadDialogOpen: boolean;
    openUploadDialog: () => void;
    closeUploadDialog: () => void;

    promptDrafts: Record<string, string>;
    setPromptDraft: (documentId: string, value: string) => void;

    queryHistory: Record<string, QueryHistoryEntry[]>;
    addQueryHistoryEntry: (documentId: string, entry: QueryHistoryEntry) => void;
}

export interface SubmitQueryInput {
    prompt : string;
    document_id: string;
    image_base64: string;
}

export const TERMINAL_DOCUMENT_STATUSES : DocumentStatus[] = ['ready','failed']
export const TERMINAL_QUERY_STATUSES : QueryStatus[] = ['completed','failed']

export const PIPELINE_STAGES: Array<{ status: DocumentStatus; label: string }> = [
    { status: 'uploaded', label: 'Uploaded' },
    { status: 'queued', label: 'Queued' },
    { status: 'analyzing', label: 'Analyzing' },
    { status: 'extracting', label: 'Extracting' },
    { status: 'embedding', label: 'Embedding' },
    { status: 'ready', label: 'Ready' },
];

