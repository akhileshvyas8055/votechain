import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const redisConfig: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis disconnected. Retrying in ${delay}ms...`);
    return delay;
  },
};

// Main Redis client for general caching
export const redis = new Redis(env.REDIS_URL, redisConfig);

// Secondary client for Pub/Sub (requires dedicated connection)
export const redisPubSub = new Redis(env.REDIS_URL, redisConfig);

redis.on('connect', () => {
  logger.info('✅ Successfully connected to Redis');
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

// Helper functions
export const cacheSet = async (key: string, value: string, ttlSeconds?: number) => {
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, value);
  } else {
    await redis.set(key, value);
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const cacheDel = async (key: string) => {
  return redis.del(key);
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  await redisPubSub.quit();
});
