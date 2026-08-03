import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis({
  host: env.redis.host,
  port: env.redis.port,
  maxRetriesPerRequest: null,
});