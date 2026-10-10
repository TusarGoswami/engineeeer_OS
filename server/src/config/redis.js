import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient = null;
let isMock = false;

export const isRedisMock = () => isMock;

// Lightweight in-memory fallback for offline test environments
class MockRedis {
  constructor() {
    this.store = new Map();
    this.status = 'ready';
  }

  async ping() {
    return 'PONG';
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, val, _mode, _duration) {
    this.store.set(key, val);
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    const val = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, val.toString());
    return val;
  }

  async expire(_key, _seconds) {
    return 1;
  }

  async zadd(_key, _score, _member) {
    return 1;
  }

  async zrevrange(_key, _start, _stop, _withScores) {
    return [];
  }

  async quit() {
    this.store.clear();
    return 'OK';
  }
}

export const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  if (env.NODE_ENV === 'test' && !process.env.USE_REAL_REDIS) {
    isMock = true;
    redisClient = new MockRedis();
    return redisClient;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 5 && env.NODE_ENV === 'test') {
          logger.warn('[Redis] Test mode fallback to mock');
          isMock = true;
          redisClient = new MockRedis();
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('[Redis] Connected successfully');
    });

    redisClient.on('error', err => {
      logger.error({ err: err.message }, '[Redis] Error occurred');
    });

    return redisClient;
  } catch (error) {
    logger.warn({ err: error.message }, '[Redis] Falling back to in-memory mock');
    isMock = true;
    redisClient = new MockRedis();
    return redisClient;
  }
};

export const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default { getRedisClient, checkRedisHealth, disconnectRedis };
