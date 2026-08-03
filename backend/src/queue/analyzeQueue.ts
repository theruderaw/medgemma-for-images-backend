import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { AnalyzeTaskPayload } from '../types';

export const ANALYZE_QUEUE_NAME = 'document-analyze';

export const analyzeQueue = new Queue<AnalyzeTaskPayload>(ANALYZE_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});