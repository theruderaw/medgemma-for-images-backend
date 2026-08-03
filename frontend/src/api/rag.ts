import { QueryJobRecord, SubmitQueryInput } from "../types";
import { apiFetch } from "./client";

export async function submitQuery(input:SubmitQueryInput) {
    return apiFetch('/rag/query',{
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export async function getQueryStatus(queryJobId:string) {
    return apiFetch<QueryJobRecord>(`/rag/status/${queryJobId}`)
}