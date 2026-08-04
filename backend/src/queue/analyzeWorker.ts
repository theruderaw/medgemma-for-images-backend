import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { ANALYZE_QUEUE_NAME } from './analyzeQueue';
import { AnalyzeTaskPayload } from '../types';
import { documentsRepo } from '../db/documents.repo';
import { inferenceClient } from '../services/inferenceClient.service';

async function processAnalyzeJob(job: Job<AnalyzeTaskPayload>): Promise<void> {
  const { document_id } = job.data;

  const doc = await documentsRepo.findById(document_id);
  if (!doc) throw new Error(`Document ${document_id} not found`);
  if (!doc.inference_ref_id) {
    throw new Error(`Document ${document_id} has not been ingested (missing inference_ref_id)`);
  }

  await documentsRepo.setStatus(document_id, 'analyzing');

  // POST /documents/{id}/analyze on the inference server runs vision ->
  // structured extraction -> chunking -> embedding in ONE synchronous call.
  // There's no separate extract/embed step to call afterward anymore —
  // the AnalysisResponse that comes back already reflects the finished
  // pipeline (analysis + chunks persisted server-side).
  const analysis = await inferenceClient.analyzeDocument({
    inference_document_id: doc.inference_ref_id,
  });

  await documentsRepo.setInferenceAnalysisId(document_id, analysis.analysis_id);

  await documentsRepo.saveAnalysis({
    document_id,
    summary: analysis.summary,
    entities: analysis.structured_data.entities,
    raw: analysis.raw_output,
  });

  await documentsRepo.setStatus(document_id, 'ready');
}

export function startAnalyzeWorker(): Worker<AnalyzeTaskPayload> {
  const worker = new Worker<AnalyzeTaskPayload>(ANALYZE_QUEUE_NAME, processAnalyzeJob, {
    connection: redisConnection,
    concurrency: 4,
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    await documentsRepo.setStatus(job.data.document_id, 'failed', err.message);
  });

  return worker;
}