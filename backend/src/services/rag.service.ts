import { documentsRepo } from '../db/documents.repo';
import { queryJobsRepo } from '../db/queries.repo';
import { queryQueue } from '../queue/queryQueue';
import { ApiError, Extensions, QueryJobRecord, RagQueryRequestBody } from '../types';
import { inferenceClient } from './inferenceClient.service';

import { storageService } from './storage.service';

export interface SubmitQueryInput {
  prompt: string;
  image?: { buffer: Buffer; mimeType: string; originalName: string };
}

export const ragService = {
  async query(documentId: string, input: SubmitQueryInput): Promise<any> {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');
    if (!doc.inference_ref_id) throw new ApiError(409, 'Document has not been submitted/analyzed yet');
    if (doc.status !== 'ready') throw new ApiError(409, `Document is not ready for querying (status: ${doc.status})`);

    let imageBase64: string | undefined;

    if (input.image) {
      imageBase64 = input.image.buffer.toString('base64');
    }

    const response = await inferenceClient.ragQuery(doc.inference_ref_id, {
      prompt: input.prompt,
      image_base64: imageBase64,
    });

    return response;
  },

  async getQueryStatus(queryJobId: string): Promise<QueryJobRecord> {
    const job = await queryJobsRepo.findById(queryJobId);
    if (!job) throw new ApiError(404, 'Query job not found');
    return job;
  },
};