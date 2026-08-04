import { RagQueryJob as PrismaRagQueryJob } from '@prisma/client';
import { prisma } from '../config/prisma';
import { QueryJobRecord, QueryStatus } from '../types';

function mapRow(row: PrismaRagQueryJob): QueryJobRecord {
  return {
    id: row.id,
    document_id: row.documentId,
    prompt: row.prompt,
    has_image: row.hasImage,
    status: row.status,
    answer: row.answer,
    error_message: row.errorMessage,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export const queryJobsRepo = {
  async create(input: { document_id: string; prompt: string; has_image: boolean }): Promise<QueryJobRecord> {
    const row = await prisma.ragQueryJob.create({
      data: {
        documentId: input.document_id,
        prompt: input.prompt,
        hasImage: input.has_image,
        status: 'queued',
      },
    });
    return mapRow(row);
  },

  async findById(id: string): Promise<QueryJobRecord | null> {
    const row = await prisma.ragQueryJob.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  },

  async setStatus(id: string, status: QueryStatus, patch: { answer?: string; error_message?: string } = {}): Promise<void> {
    await prisma.ragQueryJob.update({
      where: { id },
      data: {
        status,
        ...(patch.answer !== undefined ? { answer: patch.answer } : {}),
        ...(patch.error_message !== undefined ? { errorMessage: patch.error_message } : {}),
      },
    });
  },
};
