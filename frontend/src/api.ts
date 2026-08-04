const BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Documents ─────────────────────────────────────────────────────────────────

export const api = {
  // GET /documents
  listDocuments: () => request<{ documents: any[] }>('/documents'),

  // POST /documents  (multipart)
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<any>('/documents', {
      method: 'POST',
      body: form,
    });
  },

  // POST /documents/:id/analyze
  analyzeDocument: (document_id: string) =>
    request<any>(
      `/documents/${document_id}/analyze`,
      { method: 'POST' }
    ),

  // GET /documents/:id/analysis
  getAnalysis: (document_id: string) =>
    request<any>(`/documents/${document_id}/analysis`),

  // DELETE /documents/:id
  deleteDocument: (document_id: string) =>
    request<void>(`/documents/${document_id}`, { method: 'DELETE' }),

  // POST /documents/:id/query
  queryDocument: async (document_id: string, prompt: string, image?: File) => {
    let image_base64 = null;
    if (image) {
      image_base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });
    }
    return request<any>(
      `/documents/${document_id}/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image_base64 }),
      }
    );
  },

  // GET /health
  health: () => request<{ status: string }>('/health'),
};
