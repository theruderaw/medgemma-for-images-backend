import { apiFetch } from "./client";
import type { DocumentAnalysis,DocumentRecord,AnalysisResponse, DocumentStatusResponse } from "../types";

export async function uploadDocument(file:File) : Promise<DocumentRecord> {
    const form = new FormData();
    form.append('file',file);
    return apiFetch<DocumentRecord>('/documents',
        {
            method: 'POST',
            body: form
        }
    )
}

export async function listDocuments(): Promise<DocumentRecord[]> {
    return apiFetch<DocumentRecord[]>('/documents')
}

export async function submitDocument(documentId:string): Promise<DocumentRecord> {
    return apiFetch<DocumentRecord>('/documents/submit',{
        method:'POST',
        body: JSON.stringify({document_id:documentId})
    })
}

export async function analyzeDocument(documentId:string): Promise<AnalysisResponse> {
    return apiFetch(`/documents/analyze/${documentId}`,{
        method: 'POST'
    })
}

export async function getDocumentStatus(documentId:string): Promise<DocumentStatusResponse> {
    return apiFetch(`/status/${documentId}`)
}

export async function getDocumentAnalysis(documentId:string): Promise<DocumentAnalysis> {
    return apiFetch<DocumentAnalysis>(`/documents/${documentId}/analysis`)
}

export async function deleteDocument(documentId:string): Promise<void> {
    return apiFetch<void>(`/documents/${documentId}`)
}