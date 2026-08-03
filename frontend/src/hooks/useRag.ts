import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryStatus, submitQuery } from "../api/rag";
import { TERMINAL_QUERY_STATUSES } from "../types";

const QUERY_POLL_MS = 1200;

export function useSubmitQuery() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitQuery,
        onSuccess: (_data,variables) => {
            queryClient.invalidateQueries({queryKey:['status',variables.document_id]})
        }
    })
}

export function useQueryStatus(queryJobId : string | null) {
    return useQuery({
        queryKey: ['query-job',queryJobId],
        queryFn: () => getQueryStatus(queryJobId as string),
        enabled: !!queryJobId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (!status || TERMINAL_QUERY_STATUSES.includes(status)) return false;
            return QUERY_POLL_MS
        }
    })
}