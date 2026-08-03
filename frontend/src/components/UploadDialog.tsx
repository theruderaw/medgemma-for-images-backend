import { useRef, useState } from 'react';
import { useUploadDocument } from '../hooks/useDocuments';
import { useUiStore } from '../store/useUiStore';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

    export function UploadDialog() {
    const isOpen = useUiStore((s) => s.uploadDialogOpen);
    const close = useUiStore((s) => s.closeUploadDialog);
    const selectDocument = useUiStore((s) => s.selectDocument);
    const upload = useUploadDocument();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    if (!isOpen) return null;

    function handleFile(file: File | undefined) {
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
        setLocalError('Only .png and .jpg files are accepted.');
        return;
        }
        setLocalError(null);
        upload.mutate(file, {
        onSuccess: (doc) => {
            selectDocument(doc.id);
            close();
            upload.reset();
        },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm" onClick={close}>
        <div
            className="w-full max-w-md rounded-xl border border-hairline bg-panel p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Ingest document</h2>
            <button
                onClick={close}
                className="rounded-md p-1 text-text-dim transition-colors hover:bg-panel-2 hover:text-text"
                aria-label="Close"
            >
                ✕
            </button>
            </div>

            <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={[
                'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                isDragging ? 'border-amber bg-amber-dim' : 'border-hairline hover:border-slate-blue',
            ].join(' ')}
            >
            <p className="font-mono text-sm text-text-dim">Drop a .png or .jpg, or click to browse</p>
            <p className="mt-1 font-mono text-[11px] text-text-dim">Max 20MB</p>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
            </div>

            {(localError || upload.isError) && (
            <p className="mt-3 font-mono text-xs text-rose">
                {localError ?? (upload.error instanceof Error ? upload.error.message : 'Upload failed')}
            </p>
            )}

            {upload.isPending && <p className="mt-3 font-mono text-xs text-slate-blue">Uploading…</p>}
        </div>
        </div>
    );
}