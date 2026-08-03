import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { RagQueryTaskPayload } from '../types';

export const QUERY_QUEUE_NAME = 'rag-query';

export const queryQueue = new Queue<RagQueryTaskPayload>(QUERY_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});