import { documentsRepo } from '../db/documents.repo';
import { queryJobsRepo } from '../db/queries.repo';
import { queryQueue } from '../queue/queryQueue';
import { ApiError, QueryJobRecord, RagQueryRequestBody } from '../types';

export const ragService = {
  async submitQuery(body: RagQueryRequestBody): Promise<{ query_job_id: string }> {
    const doc = await documentsRepo.findById(body.document_id);
    if (!doc) throw new ApiError(404, 'Document not found');
    if (!doc.inference_ref_id) {
      throw new ApiError(409, 'Document has not been submitted/analyzed yet');
    }
    if (doc.status === 'querying') {
      throw new ApiError(409, 'Document already has a query in progress; concurrent queries are not allowed');
    }
    if (doc.status !== 'ready') {
      throw new ApiError(409, `Document is not ready for querying (status: ${doc.status})`);
    }

    const job = await queryJobsRepo.create({
      document_id: body.document_id,
      prompt: body.prompt,
      has_image: Boolean(body.image_base64),
    });

    await documentsRepo.setStatus(body.document_id, 'querying');

    await queryQueue.add('rag-query', {
      query_job_id: job.id,
      document_id: body.document_id,
      prompt: body.prompt,
      image_base64: body.image_base64,
    });

    return { query_job_id: job.id };
  },

  async getQueryStatus(queryJobId: string): Promise<QueryJobRecord> {
    const job = await queryJobsRepo.findById(queryJobId);
    if (!job) throw new ApiError(404, 'Query job not found');
    return job;
  },
};