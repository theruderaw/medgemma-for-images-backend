import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import type { DocumentRecord } from './types';
import { DocumentDetail } from './DocumentDetail';

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  uploaded:  'status-gray',
  queued:    'status-blue',
  uploading: 'status-blue',
  analyzing: 'status-purple',
  extracting:'status-purple',
  embedding: 'status-indigo',
  querying:  'status-indigo',
  ready:     'status-green',
  failed:    'status-red',
};

const STATUS_LABEL: Record<string, string> = {
  uploaded:  'Uploaded',
  queued:    'Queued',
  uploading: 'Uploading',
  analyzing: 'Analyzing',
  extracting:'Extracting',
  embedding: 'Embedding',
  querying:  'Querying',
  ready:     'Ready',
  failed:    'Failed',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`status-dot ${STATUS_COLOR[status] ?? 'status-gray'}`} />
  );
}

// ── Upload Drop Zone ───────────────────────────────────────────────────────

function UploadZone({ onUploaded }: { onUploaded: (doc: DocumentRecord) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadDocument(file);
      // Fetch full doc to get all fields
      const docs = await api.listDocuments();
      const doc = docs.find(d => d.id === (res as unknown as { document_id?: string }).document_id || d.id === res.document_id);
      if (doc) onUploaded(doc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = '';
  }

  return (
    <label
      className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={onFileChange}
        disabled={uploading}
      />
      <div className="upload-zone-inner">
        {uploading ? (
          <>
            <div className="spinner-lg" />
            <p className="upload-hint">Uploading…</p>
          </>
        ) : (
          <>
            <div className="upload-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="upload-primary">Drop an image here or <span className="upload-link">browse</span></p>
            <p className="upload-hint">PNG, JPEG · Max 20 MB</p>
          </>
        )}
      </div>
      {error && <div className="error-box upload-error">{error}</div>}
    </label>
  );
}

// ── Document List Item ─────────────────────────────────────────────────────

function DocListItem({
  doc,
  selected,
  onClick,
}: {
  doc: DocumentRecord;
  selected: boolean;
  onClick: () => void;
}) {
  const sizeKb = Math.ceil(Number(doc.size_bytes) / 1024);
  const date = new Date(doc.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <button className={`doc-item ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="doc-item-left">
        <span className="doc-icon">{doc.mime_type === 'image/png' ? '🖼️' : '🔬'}</span>
        <div className="doc-item-text">
          <span className="doc-item-name">{doc.original_filename}</span>
          <span className="doc-item-meta">{sizeKb} KB · {date}</span>
        </div>
      </div>
      <div className="doc-item-right">
        <StatusDot status={doc.status} />
        <span className={`badge-xs ${STATUS_COLOR[doc.status] ?? 'status-gray'}`}>
          {STATUS_LABEL[doc.status] ?? doc.status}
        </span>
      </div>
    </button>
  );
}

// ── Health indicator ───────────────────────────────────────────────────────

function HealthDot() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(() => setOk(true)).catch(() => setOk(false));
    const t = setInterval(() => {
      api.health().then(() => setOk(true)).catch(() => setOk(false));
    }, 15_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`health-dot ${ok === null ? 'health-unknown' : ok ? 'health-ok' : 'health-err'}`}>
      <span className="health-pulse" />
      <span className="health-label">{ok === null ? 'Checking…' : ok ? 'API online' : 'API offline'}</span>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await api.listDocuments();
      setDocs(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function handleUploaded(doc: DocumentRecord) {
    setDocs(prev => [doc, ...prev]);
    setSelectedId(doc.id);
    setShowUpload(false);
  }

  function handleDeleted(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleStatusChange(id: string, status: string) {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: status as DocumentRecord['status'] } : d));
  }

  const selectedDoc = docs.find(d => d.id === selectedId) ?? null;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="brand-name">MedGemma</span>
              <span className="brand-sub">Image Analysis</span>
            </div>
          </div>
        </div>

        <div className="sidebar-actions">
          <button className="btn-new-doc" onClick={() => setShowUpload(v => !v)}>
            <span>+ New Document</span>
          </button>
        </div>

        {showUpload && (
          <div className="sidebar-upload">
            <UploadZone onUploaded={handleUploaded} />
          </div>
        )}

        <div className="sidebar-list-header">
          <span>Documents</span>
          <button className="refresh-btn" onClick={fetchDocs} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="doc-list">
          {loading && (
            <div className="list-loading">
              <div className="spinner-sm" />
              <span>Loading…</span>
            </div>
          )}
          {fetchError && <div className="error-box sidebar-error">{fetchError}</div>}
          {!loading && docs.length === 0 && !fetchError && (
            <div className="empty-list">
              <p>No documents yet.</p>
              <p className="muted">Upload an image to get started.</p>
            </div>
          )}
          {docs.map(doc => (
            <DocListItem
              key={doc.id}
              doc={doc}
              selected={selectedId === doc.id}
              onClick={() => { setSelectedId(doc.id); setShowUpload(false); }}
            />
          ))}
        </div>

        <div className="sidebar-footer">
          <HealthDot />
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {selectedDoc ? (
          <DocumentDetail
            key={selectedDoc.id}
            doc={selectedDoc}
            onDeleted={() => handleDeleted(selectedDoc.id)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="empty-state-title">Select a document</h2>
            <p className="empty-state-sub">Choose a document from the sidebar or upload a new medical image to begin AI analysis.</p>
            <button className="btn-primary" onClick={() => setShowUpload(true)}>
              Upload Image
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
