import { apiFetch } from './client';

export async function getHealth(): Promise<{ status: string }> {
    return apiFetch('/health');
}