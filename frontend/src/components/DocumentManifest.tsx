import { useDocumentsQuery } from '../hooks/useDocuments';
import { useUiStore } from '../store/useUiStore';
import StatusPill  from './StatusPill';
import { formatRelativeTime, shortId } from '../lib/format';

export function DocumentManifest() {
    const { data: documents, isLoading, isError } = useDocumentsQuery();
    const selectedId = useUiStore((s) => s.selectedDocumentId);
    const selectDocument = useUiStore((s) => s.selectDocument);
    const openUploadDialog = useUiStore((s) => s.openUploadDialog);

    return (
        <div className="flex h-full flex-col border-r border-hairline bg-panel">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-dim">Manifest</h2>
            <button
            onClick={openUploadDialog}
            className="rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-text-dim transition-colors hover:border-amber hover:text-amber"
            >
            + Ingest
            </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="px-4 py-6 font-mono text-xs text-text-dim">Loading…</p>}
            {isError && <p className="px-4 py-6 font-mono text-xs text-rose">Could not reach the pipeline API.</p>}

            {documents && documents.length === 0 && (
            <div className="px-4 py-10 text-center">
                <p className="font-mono text-xs text-text-dim">No documents yet.</p>
                <button onClick={openUploadDialog} className="mt-2 font-mono text-xs text-amber hover:underline">
                Ingest your first one →
                </button>
            </div>
            )}

            {documents?.map((doc) => (
            <button
                key={doc.id}
                onClick={() => selectDocument(doc.id)}
                className={[
                'block w-full border-b border-hairline px-4 py-3 text-left transition-colors',
                selectedId === doc.id ? 'bg-panel-2' : 'hover:bg-panel-2/60',
                ].join(' ')}
            >
                <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-text" title={doc.original_filename}>
                    {doc.original_filename}
                </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                <span className="font-mono text-[11px] text-text-dim">
                    #{shortId(doc.id)} · {formatRelativeTime(doc.created_at)}
                </span>
                <StatusPill status={doc.status} />
                </div>
            </button>
            ))}
        </div>
        </div>
    );
}