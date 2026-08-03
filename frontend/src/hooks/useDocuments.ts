import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeDocument, deleteDocument, getDocumentAnalysis, getDocumentStatus, listDocuments, submitDocument, uploadDocument } from "../api/document";
import { TERMINAL_DOCUMENT_STATUSES } from "../types";

const STATUS_POLL_MS = 500;

export function useDocumentsQuery() {
    return useQuery({
        queryKey: ['documents'],
        queryFn: listDocuments,
        refetchInterval: 5000,
    })
}

export function useUploadDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: uploadDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:['documents']})
        }
    })
}

export function useSubmitDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitDocument,
        onSuccess: (doc) => {
            queryClient.invalidateQueries({queryKey: ['document']});
            queryClient.invalidateQueries({queryKey: ['status',doc.id]});
        }
    })
}

export function useAnalyzeDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: analyzeDocument,
        onSuccess: (_data, documentId) => {
        queryClient.invalidateQueries({ queryKey: ['status', documentId] });
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}

export function useDocumentStatus(documentId: string|null) {
    return useQuery({
        queryKey: ['status',documentId],
        queryFn: () => getDocumentStatus(documentId as string),
        enabled: !documentId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (!status || TERMINAL_DOCUMENT_STATUSES.includes(status)) return false;
            return STATUS_POLL_MS
        },
    })
}

export function useDocumentsAnalysis(documentId: string|null, enabled: boolean){
    return useQuery({
        queryKey:['analysis',documentId],
        queryFn: () => getDocumentAnalysis(documentId as string),
        enabled : !documentId && enabled,
        retry: false,
    })
}

export function useDeleteDocument(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:['documents']})
        }
    })
}