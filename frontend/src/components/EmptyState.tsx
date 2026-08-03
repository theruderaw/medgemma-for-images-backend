import { useUiStore } from '../store/useUiStore';

export function EmptyState() {
    const openUploadDialog = useUiStore((s) => s.openUploadDialog);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="font-mono text-4xl text-hairline">◇</div>
        <p className="font-mono text-sm text-text-dim">Select a document from the manifest, or ingest a new one.</p>
        <button
            onClick={openUploadDialog}
            className="mt-1 rounded-md border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-text-dim transition-colors hover:border-amber hover:text-amber"
        >
            + Ingest document
        </button>
        </div>
    );
}