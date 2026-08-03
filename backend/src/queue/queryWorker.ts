import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { QUERY_QUEUE_NAME } from './queryQueue';
import { RagQueryTaskPayload } from '../types';
import { documentsRepo } from '../db/documents.repo';
import { queryJobsRepo } from '../db/queries.repo';
import { inferenceClient } from '../services/inferenceClient.service';

async function processQueryJob(job: Job<RagQueryTaskPayload>): Promise<void> {
  const { query_job_id, document_id, prompt, image_base64 } = job.data;

  const doc = await documentsRepo.findById(document_id);
  if (!doc) throw new Error(`Document ${document_id} not found`);
  if (!doc.inference_ref_id) throw new Error(`Document ${document_id} has no inference_ref_id`);

  await queryJobsRepo.setStatus(query_job_id, 'querying');

  try {
    const result = await inferenceClient.ragQuery({
      question: prompt,
      imageBuffer: image_base64 ? Buffer.from(image_base64, 'base64') : undefined,
    });

    await queryJobsRepo.setStatus(query_job_id, 'completed', { answer: result.answer });
  } finally {
    const current = await documentsRepo.findById(document_id);
    if (current && current.status === 'querying') {
      await documentsRepo.setStatus(document_id, 'ready');
    }
  }
}

export function startQueryWorker(): Worker<RagQueryTaskPayload> {
  const worker = new Worker<RagQueryTaskPayload>(QUERY_QUEUE_NAME, processQueryJob, {
    connection: redisConnection,
    concurrency: 4,
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    await queryJobsRepo.setStatus(job.data.query_job_id, 'failed', { error_message: err.message });
    const doc = await documentsRepo.findById(job.data.document_id);
    if (doc && doc.status === 'querying') {
      await documentsRepo.setStatus(job.data.document_id, 'failed', err.message);
    }
  });

  return worker;
}