import { Document as PrismaDocument, DocumentAnalysis as PrismaDocumentAnalysis, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { DocumentAnalysis, DocumentRecord, DocumentStatus } from '../types';

function mapDocument(row: PrismaDocument): DocumentRecord {
  return {
    id: row.id,
    original_filename: row.originalFilename,
    mime_type: row.mimeType as 'image/png' | 'image/jpeg',
    size_bytes: Number(row.sizeBytes),
    storage_key: row.storageKey,
    status: row.status,
    inference_ref_id: row.inferenceRefId,
    inference_analysis_id: row.inferenceAnalysisId,
    error_message: row.errorMessage,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function mapAnalysis(row: PrismaDocumentAnalysis): DocumentAnalysis {
  return {
    document_id: row.documentId,
    summary: row.summary,
    entities: row.entities as Array<Record<string, unknown>>,
    raw: row.raw as Record<string, unknown>,
    created_at: row.createdAt,
  };
}

export const documentsRepo = {
  async create(input: {
    original_filename: string;
    mime_type: 'image/png' | 'image/jpeg';
    size_bytes: number;
    storage_key: string;
  }): Promise<DocumentRecord> {
    const row = await prisma.document.create({
      data: {
        originalFilename: input.original_filename,
        mimeType: input.mime_type,
        sizeBytes: BigInt(input.size_bytes),
        storageKey: input.storage_key,
        status: 'uploaded',
      },
    });
    return mapDocument(row);
  },

  async findById(id: string): Promise<DocumentRecord | null> {
    const row = await prisma.document.findUnique({ where: { id } });
    return row ? mapDocument(row) : null;
  },

  async listAll(): Promise<DocumentRecord[]> {
    const rows = await prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mapDocument);
  },

  async setInferenceRef(id: string, inferenceRefId: string): Promise<DocumentRecord | null> {
    const row = await prisma.document.update({
      where: { id },
      data: { inferenceRefId },
    });
    return mapDocument(row);
  },

  async setInferenceAnalysisId(id: string, analysisId: string): Promise<DocumentRecord | null> {
    const row = await prisma.document.update({
      where: { id },
      data: { inferenceAnalysisId: analysisId },
    });
    return mapDocument(row);
  },

  async setStatus(id: string, status: DocumentStatus, errorMessage: string | null = null): Promise<DocumentRecord | null> {
    const row = await prisma.document.update({
      where: { id },
      data: { status, errorMessage },
    });
    return mapDocument(row);
  },

  async delete(id: string): Promise<void> {
    await prisma.document.delete({ where: { id } });
  },

  async saveAnalysis(analysis: {
    document_id: string;
    summary: string;
    entities: Array<Record<string, unknown>>;
    raw: string;
  }): Promise<void> {
    await prisma.documentAnalysis.upsert({
      where: { documentId: analysis.document_id },
      update: {
        summary: analysis.summary,
        entities: analysis.entities as unknown as Prisma.InputJsonValue,
        raw: analysis.raw,
      },
      create: {
        documentId: analysis.document_id,
        summary: analysis.summary,
        entities: analysis.entities as unknown as Prisma.InputJsonValue,
        raw: analysis.raw ?? null,
      },
    });
  },

  async getAnalysis(documentId: string): Promise<DocumentAnalysis | null> {
    const row = await prisma.documentAnalysis.findUnique({ where: { documentId } });
    return row ? mapAnalysis(row) : null;
  },
};
