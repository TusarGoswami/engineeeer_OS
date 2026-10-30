// EngineerOS BullMQ Background Worker Entry Point
import { Worker } from 'bullmq';
import { connectDB } from './config/db.js';
import { checkRedisHealth, isRedisMock } from './config/redis.js';
import { QUEUE_NAMES, getRedisConnectionOptions } from './jobs/queues.js';
import { CodeExecWorkerService } from './jobs/workers/codeExec.worker.js';
import { AiFeedbackWorkerService } from './jobs/workers/aiFeedback.worker.js';
import { ProgressWorkerService } from './jobs/workers/progress.worker.js';
import { logger } from './config/logger.js';

logger.info('[EngineerOS Worker] Background worker service starting...');

let activeWorkers = [];

const initBullWorkers = () => {
  try {
    const connection = getRedisConnectionOptions();

    const codeWorker = new Worker(
      QUEUE_NAMES.CODE_EXEC,
      async job => CodeExecWorkerService.processCodeSubmission(job),
      { connection, concurrency: 10 }
    );

    const aiWorker = new Worker(
      QUEUE_NAMES.AI_FEEDBACK,
      async job => AiFeedbackWorkerService.processInterviewEvaluation(job),
      { connection, concurrency: 5 }
    );

    const progressWorker = new Worker(
      QUEUE_NAMES.PROGRESS,
      async job => ProgressWorkerService.processProgressJob(job),
      { connection, concurrency: 20 }
    );

    const notifWorker = new Worker(
      QUEUE_NAMES.NOTIFICATIONS,
      async job => {
        logger.info(
          { jobId: job.id, data: job.data },
          '[NotificationsWorker] Processed notification'
        );
      },
      { connection, concurrency: 15 }
    );

    activeWorkers = [codeWorker, aiWorker, progressWorker, notifWorker];

    activeWorkers.forEach(w => {
      w.on('completed', job => {
        logger.debug({ queue: w.name, jobId: job.id }, '[Worker] Job completed');
      });
      w.on('failed', (job, err) => {
        logger.error({ queue: w.name, jobId: job?.id, err: err.message }, '[Worker] Job failed');
      });
    });

    logger.info(
      '[EngineerOS Worker] All 4 BullMQ workers active: code-exec, ai-feedback, progress, notifications'
    );
  } catch (err) {
    logger.error({ err: err.message }, '[EngineerOS Worker] Error initializing BullMQ workers');
  }
};

const startWorkers = async () => {
  await connectDB();

  const redisReady = await checkRedisHealth();

  if (!redisReady || isRedisMock()) {
    logger.warn(
      '[EngineerOS Worker] Redis not running on localhost:6379. Background queue consumers paused in offline mode (API operates with in-memory mocks).'
    );
    // Keep event loop alive and retry periodically
    setInterval(async () => {
      const available = await checkRedisHealth();
      if (available && !isRedisMock() && activeWorkers.length === 0) {
        logger.info(
          '[EngineerOS Worker] Redis connection detected! Initializing queue consumers...'
        );
        initBullWorkers();
      }
    }, 15000);
    return;
  }

  initBullWorkers();
};

startWorkers().catch(err => {
  logger.error({ err: err.message }, '[EngineerOS Worker] Fatal startup error');
});

// Graceful shutdown
const shutdown = async signal => {
  logger.info(
    `[EngineerOS Worker] Received ${signal}. Draining queue consumers and shutting down...`
  );
  for (const w of activeWorkers) {
    await w.close();
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
