// EngineerOS BullMQ Background Worker Entry Point

console.log('[EngineerOS Worker] Background worker service starting...');
console.log(
  '[EngineerOS Worker] Initializing job queues: code-exec, ai-feedback, progress, notifications'
);

// Graceful shutdown
const shutdown = signal => {
  console.log(
    `[EngineerOS Worker] Received ${signal}. Draining queue consumers and shutting down...`
  );
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
