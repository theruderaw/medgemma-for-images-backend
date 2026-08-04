# MedGemma Inference Service: API Migration & Usage Guide

This guide details how to consume the MedGemma Inference API from a backend service or frontend application. The API has recently been refactored to a fully asynchronous architecture, dramatically improving concurrency and performance.

## Core Concepts

The API is responsible for processing medical images through a two-layer AI pipeline (Vision + Text Extraction), chunking and indexing the resulting analysis, and serving RAG (Retrieval-Augmented Generation) queries against that indexed knowledge.

**All operations are now fully asynchronous.** The server will not block incoming requests while waiting for Ollama model inference, file I/O, or Postgres operations.

## Endpoint Lifecycle

A typical application workflow follows three steps: **Upload**, **Analyze**, and **Query**.

### 1. Upload Document (`POST /documents`)

Upload an image (PNG/JPEG) to store it and initialize a document tracking record.

**Request:**
```http
POST /documents
Content-Type: multipart/form-data

file: <binary image data>
```

**Response (201 Created):**
```json
{
  "document_id": "50cf1b65-5777-4a04-9a35-7c48ae990790",
  "original_filename": "scan.png",
  "stored_filename": "uuid-formatted-name.png",
  "content_type": "image/png",
  "status": "uploaded",
  "error_message": null,
  "created_at": "2026-08-04T12:00:00",
  "updated_at": "2026-08-04T12:00:00"
}
```

### 2. Analyze Document (`POST /documents/{id}/analyze`)

This endpoint triggers the full heavy-duty pipeline:
1. Vision model transcriptions.
2. Text model JSON structure extraction.
3. Sentence-aware text chunking.
4. Pgvector embedding generation.

*Note: For strict backwards compatibility with frozen frontend contracts, this endpoint currently awaits the full analysis synchronously. The connection will remain open until the models finish running. The server's event loop will remain unblocked for other requests.*

**Request:**
```http
POST /documents/{document_id}/analyze
```

**Response (200 OK):**
```json
{
  "analysis_id": "ba1e6eb5-e568-49b1-a835-d485c86a48f1",
  "document_id": "50cf1b65-5777-4a04-9a35-7c48ae990790",
  "raw_output": "Cleaned narrative produced by the vision model.",
  "summary": "Short extracted summary.",
  "structured_data": {
    "entities": [
      {"type": "finding", "value": "Example finding"}
    ]
  },
  "model_name": "medgemma1.5:4b",
  "created_at": "2026-08-04T12:02:00"
}
```

### 3. Ask RAG Queries (`POST /documents/{id}/query`)

Once a document is analyzed, you can query it using context-scoped RAG.

**Request:**
```http
POST /documents/{document_id}/query
Content-Type: application/json

{
  "prompt": "What findings are recorded in this document?",
  "image_base64": null
}
```
*Note: Supplying `image_base64` will route the prompt to the Vision model instead of the standard Text model.*

**Response (200 OK):**
```json
{
  "answer": "According to [CHUNK 1], the patient exhibits...",
  "used_chunk_ids": ["4d29e254-9953-469e-b4ac-d8be3f25b604"]
}
```

---

## Migration Notes for Consumers

If you are migrating to this version of the Inference Service, please note the following behavioral improvements:

1. **High Concurrency Handling:** You can confidently dispatch concurrent `/analyze` or `/query` requests from your frontend/backend. While Ollama handles requests sequentially (or based on its own config), the FastAPI server will no longer drop connections or stall other lightweight routes (like `/health` or `/documents`).
2. **Improved Error Boundaries:** Data persistence uses proper `AsyncSession` handling. Incomplete or failing inferences (e.g., if Ollama crashes) will cleanly raise HTTP 500s without leaking DB connections.
3. **Strict JSON Schemas:** Extraction prompts have been rewritten to strictly prohibit markdown tags (```json ... ```) or conversational wrappers. The backend consumer can safely assume the `.structured_data` property will be clean, directly-parseable JSON.

## Environment Variables Configuration

Make sure your server is running with the correct async infrastructure configs:

```bash
# Database must use the asyncpg driver (auto-switched in code, but good to know)
DATABASE_URL=postgresql+psycopg://rudra:hello@localhost:5432/inference

# Ensure Ollama is reachable
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Ensure models match your Ollama instance
VISION_MODEL=medgemma1.5:4b
TEXT_MODEL=qwen2.5:3b
EMBEDDING_MODEL=nomic-embed-text
```

## Consuming in TypeScript (Example)

```typescript
export interface AnalysisResponse {
  analysis_id: string;
  document_id: string;
  raw_output: string;
  summary: string;
  structured_data: { entities: Array<{type: string, value: string}> };
}

// 1. Upload
const uploadRes = await fetch(`${baseUrl}/documents`, {
  method: 'POST',
  body: formData
});
const doc = await uploadRes.json();

// 2. Analyze (Warning: Connection may stay open for 10-30s)
const analyzeRes = await fetch(`${baseUrl}/documents/${doc.document_id}/analyze`, {
  method: 'POST'
});
const analysis: AnalysisResponse = await analyzeRes.json();

// 3. Query
const queryRes = await fetch(`${baseUrl}/documents/${doc.document_id}/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: "What are the key entities?" })
});
const result = await queryRes.json();
console.log(result.answer);
```
