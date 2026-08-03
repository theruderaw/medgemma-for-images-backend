import { useDocumentsAnalysis } from '../hooks/useDocuments';

function EntityRow({ entity }: { entity: Record<string, unknown> }) {
    const entries = Object.entries(entity);
    return (
        <tr className="border-b border-hairline last:border-0">
        {entries.map(([key, value]) => (
            <td key={key} className="px-3 py-2 align-top">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-dim">{key}</div>
            <div className="mt-0.5 text-sm text-text">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </div>
            </td>
        ))}
        </tr>
    );
}

export function AnalysisPanel({ documentId }: { documentId: string }) {
    const { data: analysis, isLoading, isError } = useDocumentsAnalysis(documentId, true);

    if (isLoading) {
        return <p className="font-mono text-xs text-text-dim">Loading analysis…</p>;
    }

    if (isError || !analysis) {
        return <p className="font-mono text-xs text-text-dim">Analysis not available yet.</p>;
    }

    const entityColumns = analysis.entities.length > 0 ? Object.keys(analysis.entities[0]) : [];

    return (
        <div className="space-y-5">
        <div>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-dim">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-text">{analysis.summary}</p>
        </div>

        {analysis.entities.length > 0 && (
            <div>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-dim">
                Entities · {analysis.entities.length}
            </h3>
            <div className="mt-2 overflow-hidden rounded-lg border border-hairline">
                <table className="w-full">
                <thead className="bg-panel-2">
                    <tr>
                    {entityColumns.map((col) => (
                        <th
                        key={col}
                        className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wide text-text-dim"
                        >
                        {col}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {analysis.entities.map((entity, i) => (
                    <EntityRow key={i} entity={entity} />
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        )}
        </div>
    );
}