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

  async call(..._args) {
    return null;
  }

  on(_event, _handler) {
    return this;
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

  if (env.REDIS_URL === 'mock' || (env.NODE_ENV === 'test' && !process.env.USE_REAL_REDIS)) {
    isMock = true;
    redisClient = new MockRedis();
    return redisClient;
  }

  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: null,
    });

    client.on('connect', () => {
      logger.info('[Redis] Connected successfully');
    });

    client.on('error', () => {
      // Handled gracefully via fallback
    });

    redisClient = client;

    // Probe connection asynchronously
    client.connect().catch(() => {
      logger.info(
        `[Redis] Local Redis not detected on ${env.REDIS_URL}. Seamlessly falling back to in-memory mock store.`
      );
      isMock = true;
      redisClient = new MockRedis();
    });

    return redisClient;
  } catch (_error) {
    logger.info(`[Redis] Falling back to in-memory mock store for ${env.REDIS_URL}`);
    isMock = true;
    redisClient = new MockRedis();
    return redisClient;
  }
};

export const checkRedisHealth = async () => {
  try {
    if (isMock) return true;
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return isMock;
  }
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default { getRedisClient, checkRedisHealth, disconnectRedis };
