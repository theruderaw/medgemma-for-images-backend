import type { DocumentStatus,QueryStatus } from "../types";

type AnyStatus = DocumentStatus | QueryStatus 

const STATUS_STYLES: Record<AnyStatus, { bg: string; fg: string; label: string; pulse?: boolean }> = {
    uploaded: { bg: 'bg-slate-blue-dim', fg: 'text-slate-blue', label: 'Uploaded' },
    queued: { bg: 'bg-slate-blue-dim', fg: 'text-slate-blue', label: 'Queued' },
    uploading: { bg: 'bg-slate-blue-dim', fg: 'text-slate-blue', label: 'Uploading' },
    analyzing: { bg: 'bg-amber-dim', fg: 'text-amber', label: 'Analyzing', pulse: true },
    extracting: { bg: 'bg-amber-dim', fg: 'text-amber', label: 'Extracting', pulse: true },
    embedding: { bg: 'bg-amber-dim', fg: 'text-amber', label: 'Embedding', pulse: true },
    querying: { bg: 'bg-amber-dim', fg: 'text-amber', label: 'Querying', pulse: true },
    ready: { bg: 'bg-teal-dim', fg: 'text-teal', label: 'Ready' },
    completed: { bg: 'bg-teal-dim', fg: 'text-teal', label: 'Completed' },
    failed: { bg: 'bg-rose-dim', fg: 'text-rose', label: 'Failed' },
};

function StatusPill({status}:{status:AnyStatus}){
    const style = STATUS_STYLES[status];
    return (
        <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${style.bg} ${style.fg}`}
        >
        <span className={`h-1.5 w-1.5 rounded-full bg-current ${style.pulse ? 'animate-pulse' : ''}`} />
        {style.label}
        </span>
  );
}

export default StatusPill;