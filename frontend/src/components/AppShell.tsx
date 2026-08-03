import { useHealth } from '../hooks/useHealth';
import { useUiStore } from '../store/useUiStore';
import { DocumentManifest } from './DocumentManifest';
import { DocumentDetail } from './DocumentDetail';
import { EmptyState } from './EmptyState';
import { UploadDialog } from './UploadDialog';

export function AppShell() {
    const { data: health, isError } = useHealth();
    const selectedDocumentId = useUiStore((s) => s.selectedDocumentId);
    const isConnected = !isError && health?.status === 'ok';

    return (
        <div className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b border-hairline px-6 py-3">
            <div className="flex items-baseline gap-2">
            <h1 className="font-display text-base font-semibold tracking-tight text-text">PIPELINE</h1>
            <span className="font-mono text-[11px] text-text-dim">document analysis console</span>
            </div>
            <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-teal' : 'bg-rose'}`} />
            <span className="font-mono text-[11px] uppercase tracking-wide text-text-dim">
                {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            <div className="w-80 shrink-0">
            <DocumentManifest />
            </div>
            {selectedDocumentId ? <DocumentDetail documentId={selectedDocumentId} /> : <EmptyState />}
        </div>

        <UploadDialog />
        </div>
    );
}