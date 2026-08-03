import { useRef, useState } from 'react';
import { useQueryStatus, useSubmitQuery } from '../hooks/useRag';
import { useUiStore } from '../store/useUiStore';
import { fileToBase64 } from '../lib/fileToBase64';
import StatusPill from './StatusPill';

function QueryLogEntry({ queryJobId, prompt }: { queryJobId: string; prompt: string }) {
    const { data: job } = useQueryStatus(queryJobId);

    return (
        <div className="rounded-lg border border-hairline bg-panel-2 p-3">
        <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[11px] text-slate-blue">&gt; {prompt}</p>
            {job && <StatusPill status={job.status} />}
        </div>
        {job?.status === 'completed' && job.answer && <p className="mt-2 text-sm leading-relaxed text-text">{job.answer}</p>}
        {job?.status === 'failed' && (
            <p className="mt-2 font-mono text-xs text-rose">{job.error_message ?? 'Query failed.'}</p>
        )}
        </div>
    );
    }

    export function QueryConsole({ documentId, isLocked }: { documentId: string; isLocked: boolean }) {
    const draft = useUiStore((s) => s.promptDrafts[documentId] ?? '');
    const setDraft = useUiStore((s) => s.setPromptDraft);
    const history = useUiStore((s) => s.queryHistory[documentId] ?? []);
    const addHistoryEntry = useUiStore((s) => s.addQueryHistoryEntry);
    const submitQuery = useSubmitQuery();

    const [attachedImage, setAttachedImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleSubmit() {
        if (!draft.trim() || isLocked) return;

        const image_base64 = attachedImage ? await fileToBase64(attachedImage) : undefined;

        submitQuery.mutate(
        { prompt: draft.trim(), document_id: documentId, image_base64:image_base64 ? image_base64 : '' },
        {
            onSuccess: (res) => {
            addHistoryEntry(documentId, { queryJobId: res.query_job_id, prompt: draft.trim() });
            setDraft(documentId, '');
            setAttachedImage(null);
            },
        }
        );
    }

    return (
        <div className="space-y-3">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-dim">Query console</h3>

        <div className="rounded-lg border border-hairline bg-panel-2 p-3">
            <textarea
            value={draft}
            onChange={(e) => setDraft(documentId, e.target.value)}
            placeholder={isLocked ? 'A query is already in progress for this document…' : 'Ask something about this document…'}
            disabled={isLocked}
            rows={2}
            className="w-full resize-none bg-transparent font-mono text-sm text-text placeholder:text-text-dim focus:outline-none disabled:opacity-50"
            />
            <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLocked}
                className="font-mono text-[11px] text-text-dim transition-colors hover:text-slate-blue disabled:opacity-50"
                >
                {attachedImage ? `📎 ${attachedImage.name}` : '📎 Attach image'}
                </button>
                {attachedImage && (
                <button onClick={() => setAttachedImage(null)} className="font-mono text-[11px] text-rose hover:underline">
                    remove
                </button>
                )}
                <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => setAttachedImage(e.target.files?.[0] ?? null)}
                />
            </div>
            <button
                onClick={handleSubmit}
                disabled={isLocked || !draft.trim() || submitQuery.isPending}
                className="rounded-md bg-amber-dim px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-amber transition-opacity hover:opacity-80 disabled:opacity-40"
            >
                {submitQuery.isPending ? 'Sending…' : 'Ask'}
            </button>
            </div>
            {submitQuery.isError && (
            <p className="mt-2 font-mono text-xs text-rose">
                {submitQuery.error instanceof Error ? submitQuery.error.message : 'Failed to submit query'}
            </p>
            )}
        </div>

        {history.length > 0 && (
            <div className="space-y-2">
            {history.map((entry) => (
                <QueryLogEntry key={entry.queryJobId} queryJobId={entry.queryJobId} prompt={entry.prompt} />
            ))}
            </div>
        )}
        </div>
    );
}