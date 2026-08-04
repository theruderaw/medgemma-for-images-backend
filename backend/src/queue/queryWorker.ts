import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { QUERY_QUEUE_NAME } from './queryQueue';
import { RagQueryTaskPayload } from '../types';
import { documentsRepo } from '../db/documents.repo';
import { queryJobsRepo } from '../db/queries.repo';
import { inferenceClient } from '../services/inferenceClient.service';
import { storageService } from '../services/storage.service';

async function processQueryJob(job: Job<RagQueryTaskPayload>): Promise<void> {
  const { query_job_id, document_id, prompt, image_storage_key, image_mime_type } = job.data;

  const doc = await documentsRepo.findById(document_id);
  if (!doc) throw new Error(`Document ${document_id} not found`);
  if (!doc.inference_ref_id) throw new Error(`Document ${document_id} has no inference_ref_id`);

  await queryJobsRepo.setStatus(query_job_id, 'querying');

  try {
    const imageBuffer = image_storage_key ? await storageService.read(image_storage_key) : undefined;

    const result = await inferenceClient.ragQuery({
      inference_document_id: doc.inference_ref_id,
      prompt,
      imageBuffer,
      imageMimeType: image_mime_type,
    });

    await queryJobsRepo.setStatus(query_job_id, 'completed', { answer: result.answer });
  } finally {
    if (image_storage_key) {
      await storageService.delete(image_storage_key).catch(() => {});
    }
    const current = await documentsRepo.findById(document_id);
    if (current && current.status === 'querying') {
      await documentsRepo.setStatus(document_id, 'ready');
    }
  }
}