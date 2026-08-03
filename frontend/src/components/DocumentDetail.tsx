import { useDocumentsQuery, useAnalyzeDocument, useDeleteDocument, useDocumentStatus, useSubmitDocument } from '../hooks/useDocuments';
import { useUiStore } from '../store/useUiStore';
import PipelineStepper from './PipelineStepper';
import { AnalysisPanel } from './AnalysisPanel';
import { QueryConsole } from './QueryConsole';
import { formatBytes, shortId } from '../lib/format';

export function DocumentDetail({ documentId }: { documentId: string }) {
    const { data: documents } = useDocumentsQuery();
    const { data: statusData } = useDocumentStatus(documentId);
    const submitDocument = useSubmitDocument();
    const analyzeDocument = useAnalyzeDocument();
    const deleteDocument = useDeleteDocument();
    const selectDocument = useUiStore((s) => s.selectDocument);

    const doc = documents?.find((d) => d.id === documentId);
    if (!doc) return null;

    const status = statusData?.status ?? doc.status;
    const errorMessage = statusData?.error_message ?? doc.error_message;

    const canSubmit = status === 'uploaded';
    const canAnalyze = status === 'uploaded' ? false : doc.inference_ref_id !== null && status !== 'failed' &&
        !['analyzing', 'extracting', 'embedding', 'queued'].includes(status);
    const isReady = status === 'ready' || status === 'querying';
    const isLockedForQuery = status === 'querying';

    function handleDelete() {
        if (!confirm(`Delete "${doc!.original_filename}"? This can't be undone.`)) return;
        deleteDocument.mutate(doc!.id, {
        onSuccess: () => selectDocument(null),
        });
    }

    return (
        <div className="flex-1 overflow-y-auto">
        <div className="border-b border-hairline px-6 py-5">
            <div className="flex items-start justify-between">
            <div>
                <h1 className="font-display text-xl font-semibold text-text">{doc.original_filename}</h1>
                <p className="mt-1 font-mono text-[11px] text-text-dim">
                #{shortId(doc.id)} · {doc.mime_type} · {formatBytes(doc.size_bytes)}
                </p>
            </div>
            <button
                onClick={handleDelete}
                disabled={deleteDocument.isPending}
                className="rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-text-dim transition-colors hover:border-rose hover:text-rose disabled:opacity-50"
            >
                {deleteDocument.isPending ? 'Deleting…' : 'Delete'}
            </button>
            </div>

            <div className="mt-5">
            <PipelineStepper status={status} errorMessage={errorMessage} />
            </div>

            <div className="mt-5 flex items-center gap-2">
            {canSubmit && (
                <button
                onClick={() => submitDocument.mutate(doc!.id)}
                disabled={submitDocument.isPending}
                className="rounded-md bg-slate-blue-dim px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-slate-blue transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                {submitDocument.isPending ? 'Submitting…' : 'Submit to inference'}
                </button>
            )}
            {canAnalyze && (
                <button
                onClick={() => analyzeDocument.mutate(doc!.id)}
                disabled={analyzeDocument.isPending}
                className="rounded-md bg-amber-dim px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-amber transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                {analyzeDocument.isPending ? 'Starting…' : status === 'failed' ? 'Retry analysis' : 'Run analysis'}
                </button>
            )}
            {(submitDocument.isError || analyzeDocument.isError) && (
                <p className="font-mono text-xs text-rose">
                {(submitDocument.error instanceof Error && submitDocument.error.message) ||
                    (analyzeDocument.error instanceof Error && analyzeDocument.error.message)}
                </p>
            )}
            </div>
        </div>

        {isReady && (
            <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
            <AnalysisPanel documentId={doc.id} />
            <QueryConsole documentId={doc.id} isLocked={isLockedForQuery} />
            </div>
        )}

        {!isReady && status !== 'failed' && (
            <div className="px-6 py-10 text-center">
            <p className="font-mono text-xs text-text-dim">
                Analysis and query tools unlock once this document reaches <span className="text-teal">ready</span>.
            </p>
            </div>
        )}
        </div>
    );
}