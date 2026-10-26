import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { disconnectRedis } from './config/redis.js';
import { logger } from './config/logger.js';

const startServer = async () => {
  try {
    // Initialize database connection
    await connectDB();

    const app = createApp();
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(
        { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
        `[EngineerOS API] Server listening at http://${env.HOST}:${env.PORT}`
      );
    });

    // Graceful shutdown
    const shutdown = async signal => {
      logger.info(`[EngineerOS API] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        logger.info('[EngineerOS API] HTTP server stopped accepting connections.');
        try {
          await disconnectDB();
          await disconnectRedis();
          logger.info('[EngineerOS API] All resources released. Shutdown complete.');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, '[EngineerOS API] Error during shutdown');
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ err: error }, '[EngineerOS API] Fatal startup failure');
    process.exit(1);
  }
};

startServer();
