import type { ApiErrorBody } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiRequestError extends Error {
    status: number;
    details?: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody> {
    try {
        return (await res.json()) as ApiErrorBody;
    } catch {
        return { error: res.statusText || `Request failed with status ${res.status}` };
    }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
        ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
        },
    });

    if (!res.ok) {
        const body = await parseErrorBody(res);
        throw new ApiRequestError(res.status, body.error, body.details);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return (await res.json()) as T;
}