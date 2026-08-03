import { PIPELINE_STAGES, type DocumentStatus } from "../types";

function stageIndex(status: DocumentStatus): number {
  if (status === 'querying') return PIPELINE_STAGES.findIndex((s) => s.status === 'ready');
  if (status === 'uploading') return PIPELINE_STAGES.findIndex((s) => s.status === 'uploaded');
  return PIPELINE_STAGES.findIndex((s) => s.status === status);
}

function PipelineStepper({status,errorMessage}:{status:DocumentStatus;errorMessage:string}){
    if (status == 'failed'){
        return (
            <div className="flex items-center gap-3 rounded-lg border border-rose/30 bg-rose-dim px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-rose" />
            <div>
                <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-rose">Pipeline failed</p>
                {errorMessage && <p className="mt-0.5 text-sm text-text-dim">{errorMessage}</p>}
            </div>
        </div>
        )
    }

    const currentIndex = stageIndex(status);

    return (
        <div className="flex items-center" role="list" aria-label="Processing pipeline">
            {PIPELINE_STAGES.map((stage, i) => {
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;
                const isPending = i > currentIndex;

                return (
                <div key={stage.status} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-2" role="listitem">
                    <div
                        className={[
                        'flex h-7 w-7 items-center justify-center rounded-full border-2 font-mono text-[10px] transition-colors',
                        isDone && 'border-teal bg-teal text-ink',
                        isCurrent && 'border-amber bg-amber-dim text-amber',
                        isPending && 'border-hairline bg-panel text-text-dim',
                        ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                        {isDone ? '✓' : i + 1}
                    </div>
                    <span
                        className={[
                        'font-mono text-[10px] uppercase tracking-wide',
                        isCurrent ? 'text-amber' : isDone ? 'text-teal' : 'text-text-dim',
                        ].join(' ')}
                    >
                        {stage.label}
                    </span>
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                    <div
                        className={['mx-1 h-px flex-1', isDone ? 'bg-teal' : 'bg-hairline'].join(' ')}
                        style={{ marginBottom: '18px' }}
                    />
                    )}
                </div>
                );
            })}
        </div>
    )
}

export default PipelineStepper;