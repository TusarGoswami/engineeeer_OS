import { Queue } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const QUEUE_NAMES = {
  CODE_EXEC: 'code-exec',
  AI_FEEDBACK: 'ai-feedback',
  PROGRESS: 'progress',
  NOTIFICATIONS: 'notifications',
};

const queues = new Map();

// Parse Redis connection details for BullMQ
const getRedisConnectionOptions = () => {
  try {
    const url = new URL(env.REDIS_URL);
    return {
      host: url.hostname || 'localhost',
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
};

export const getQueue = queueName => {
  if (queues.has(queueName)) {
    return queues.get(queueName);
  }

  // In test mode without external Redis, provide an in-memory queue mock
  if (env.NODE_ENV === 'test' && !process.env.USE_REAL_REDIS) {
    const mockQueue = {
      name: queueName,
      async add(jobName, data, _opts) {
        logger.debug({ queueName, jobName }, '[MockQueue] Enqueued job in test mode');
        return { id: `mock-job-${Date.now()}`, name: jobName, data };
      },
      async close() {},
    };
    queues.set(queueName, mockQueue);
    return mockQueue;
  }

  try {
    const queue = new Queue(queueName, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 5000, age: 7 * 24 * 3600 },
      },
    });

    queues.set(queueName, queue);
    return queue;
  } catch (err) {
    logger.warn({ err: err.message, queueName }, '[BullMQ] Falling back to mock queue');
    const mockQueue = {
      name: queueName,
      async add(_jobName, data) {
        return { id: `mock-${Date.now()}`, data };
      },
      async close() {},
    };
    queues.set(queueName, mockQueue);
    return mockQueue;
  }
};

export const codeExecQueue = () => getQueue(QUEUE_NAMES.CODE_EXEC);
export const aiFeedbackQueue = () => getQueue(QUEUE_NAMES.AI_FEEDBACK);
export const progressQueue = () => getQueue(QUEUE_NAMES.PROGRESS);
export const notificationsQueue = () => getQueue(QUEUE_NAMES.NOTIFICATIONS);

export const closeAllQueues = async () => {
  for (const queue of queues.values()) {
    if (typeof queue.close === 'function') {
      await queue.close();
    }
  }
  queues.clear();
};

export default {
  QUEUE_NAMES,
  getQueue,
  codeExecQueue,
  aiFeedbackQueue,
  progressQueue,
  notificationsQueue,
  closeAllQueues,
};
