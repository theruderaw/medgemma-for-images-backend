import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from './api';
import type { DocumentRecord, DocumentAnalysis } from './types';

// ── Status helpers ──────────────────────────────────────────────────────────

const STATUS_ORDER = [
  'uploaded', 'queued', 'uploading', 'analyzing',
  'extracting', 'embedding', 'querying', 'ready',
] as const;

const STATUS_LABEL: Record<string, string> = {
  uploaded: 'Uploaded',
  queued: 'Queued',
  uploading: 'Uploading',
  analyzing: 'Analyzing',
  extracting: 'Extracting',
  embedding: 'Embedding',
  querying: 'Querying',
  ready: 'Ready',
  failed: 'Failed',
};

const STATUS_COLOR: Record<string, string> = {
  uploaded: 'status-gray',
  queued: 'status-blue',
  uploading: 'status-blue',
  analyzing: 'status-purple',
  extracting: 'status-purple',
  embedding: 'status-indigo',
  querying: 'status-indigo',
  ready: 'status-green',
  failed: 'status-red',
};

const TERMINAL = new Set(['ready', 'failed']);
const IN_PROGRESS = new Set(['queued', 'uploading', 'analyzing', 'extracting', 'embedding', 'querying']);

function statusIndex(s: string) {
  const i = STATUS_ORDER.indexOf(s as typeof STATUS_ORDER[number]);
  return i === -1 ? 0 : i;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_COLOR[status] ?? 'status-gray'}`}>
      {IN_PROGRESS.has(status) && <span className="badge-spinner" />}
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ProgressBar({ status }: { status: string }) {
  if (status === 'failed') {
    return <div className="progress-bar-track"><div className="progress-bar-fill failed" style={{ width: '100%' }} /></div>;
  }
  const idx = statusIndex(status);
  const pct = status === 'ready' ? 100 : Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
  return (
    <div className="progress-bar-track">
      <div
        className={`progress-bar-fill ${status === 'ready' ? 'done' : 'active'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function AnalysisPanel({ analysis }: { analysis: DocumentAnalysis }) {
  const [tab, setTab] = useState<'summary' | 'entities' | 'raw'>('summary');
  return (
    <div className="analysis-panel">
      <div className="tab-bar">
        {(['summary', 'entities', 'raw'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tab === 'summary' && (
          <p className="analysis-summary">{analysis.summary}</p>
        )}
        {tab === 'entities' && (
          <div className="entities-list">
            {analysis.entities.length === 0
              ? <p className="muted">No entities extracted.</p>
              : analysis.entities.map((e, i) => (
                <div key={i} className="entity-card">
                  {Object.entries(e).map(([k, v]) => (
                    <div key={k} className="entity-row">
                      <span className="entity-key">{k}</span>
                      <span className="entity-val">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}
        {tab === 'raw' && (
          <pre className="raw-json">{JSON.stringify(analysis.raw, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

function QueryPanel({ documentId }: { documentId: string }) {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const job = await api.getRagStatus(id);
        setStatus(job.status);
        if (job.status === 'completed') {
          setAnswer(job.answer);
          stopPolling();
        } else if (job.status === 'failed') {
          setError(job.error_message ?? 'Query failed.');
          stopPolling();
        }
      } catch { stopPolling(); }
    }, 2000);
  }, [stopPolling]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setJobId(null);
    setStatus('');
    try {
      const res = await api.queryDocument(documentId, prompt.trim(), image ?? undefined);
      setJobId(res.query_job_id);
      setStatus(res.status);
      startPolling(res.query_job_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit query.');
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImage(e.target.files?.[0] ?? null);
  }

  const isPolling = jobId && !['completed', 'failed'].includes(status);

  return (
    <div className="query-panel">
      <h3 className="section-label">Ask a Question</h3>
      <form onSubmit={handleSubmit} className="query-form">
        <textarea
          className="query-textarea"
          placeholder="e.g. Does this chest X-ray show signs of pneumonia?"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          disabled={loading || !!isPolling}
        />
        <div className="query-row">
          <label className="file-label-sm">
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <span className="file-btn-sm">
              {image ? `📎 ${image.name}` : '+ Attach image (optional)'}
            </span>
          </label>
          <button
            type="submit"
            className="btn-primary btn-sm"
            disabled={loading || !!isPolling || !prompt.trim()}
          >
            {loading ? 'Submitting…' : isPolling ? 'Processing…' : 'Ask'}
          </button>
        </div>
      </form>

      {error && <div className="error-box mt-2">{error}</div>}

      {jobId && (
        <div className="query-result-box">
          <div className="query-status-row">
            <StatusBadge status={status} />
            <span className="muted text-xs">Job {jobId.slice(0, 8)}…</span>
          </div>
          {answer && (
            <div className="answer-bubble">
              <span className="answer-icon">🤖</span>
              <p className="answer-text">{answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface Props {
  doc: DocumentRecord;
  onDeleted: () => void;
  onStatusChange: (id: string, status: string) => void;
}

export function DocumentDetail({ doc, onDeleted, onStatusChange }: Props) {
  const [status, setStatus] = useState(doc.status);
  const [errorMsg, setErrorMsg] = useState(doc.error_message ?? null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Poll while in-progress
  useEffect(() => {
    if (TERMINAL.has(status)) {
      stopPolling();
      if (status === 'ready' && !analysis) {
        api.getAnalysis(doc.id).then(setAnalysis).catch(() => null);
      }
      return;
    }
    if (!IN_PROGRESS.has(status)) return;

    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await api.getStatus(doc.id);
        setStatus(s.status);
        onStatusChange(doc.id, s.status);
        if (s.status === 'failed') setErrorMsg(s.error_message);
        if (s.status === 'ready') {
          stopPolling();
          api.getAnalysis(doc.id).then(setAnalysis).catch(() => null);
        }
        if (TERMINAL.has(s.status)) stopPolling();
      } catch { /* keep polling */ }
    }, 2500);

    return stopPolling;
  }, [status, doc.id, analysis, stopPolling, onStatusChange]);

  async function handleSubmit() {
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await api.submitDocument(doc.id);
      setStatus(updated.status);
      onStatusChange(doc.id, updated.status);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAnalyze() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.analyzeDocument(doc.id);
      setStatus(res.status);
      onStatusChange(doc.id, res.status);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setActionLoading(true);
    try {
      await api.deleteDocument(doc.id);
      onDeleted();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete.');
      setActionLoading(false);
    }
  }

  const sizeKb = Math.ceil(Number(doc.size_bytes) / 1024);

  return (
    <div className="detail-card">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-group">
          <span className="file-icon">{doc.mime_type === 'image/png' ? '🖼️' : '🔬'}</span>
          <div>
            <h2 className="detail-filename">{doc.original_filename}</h2>
            <p className="detail-meta">{doc.mime_type} · {sizeKb} KB · ID: {doc.id.slice(0, 8)}…</p>
          </div>
        </div>
        <div className="detail-actions">
          {status === 'uploaded' && !doc.inference_ref_id && (
            <button className="btn-primary btn-sm" onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? '…' : 'Submit'}
            </button>
          )}
          {(status === 'uploaded' || status === 'failed') && doc.inference_ref_id && (
            <button className="btn-accent btn-sm" onClick={handleAnalyze} disabled={actionLoading}>
              {actionLoading ? '…' : 'Analyze'}
            </button>
          )}
          <button
            className={`btn-danger btn-sm ${deleteConfirm ? 'confirm' : ''}`}
            onClick={handleDelete}
            disabled={actionLoading}
            onBlur={() => setDeleteConfirm(false)}
          >
            {deleteConfirm ? 'Confirm delete?' : '🗑'}
          </button>
        </div>
      </div>

      {actionError && <div className="error-box">{actionError}</div>}

      {/* Progress */}
      <div className="detail-progress">
        <div className="progress-label-row">
          <StatusBadge status={status} />
          {errorMsg && <span className="error-inline">{errorMsg}</span>}
        </div>
        <ProgressBar status={status} />
        <div className="pipeline-steps">
          {STATUS_ORDER.map((s, i) => {
            const cur = statusIndex(status);
            const cls = s === status ? 'step active' : i < cur ? 'step done' : 'step';
            return <span key={s} className={cls}>{STATUS_LABEL[s]}</span>;
          })}
        </div>
      </div>

      {/* Analysis */}
      {status === 'ready' && analysis && (
        <AnalysisPanel analysis={analysis} />
      )}

      {/* Query */}
      {status === 'ready' && (
        <QueryPanel documentId={doc.id} />
      )}
    </div>
  );
}
