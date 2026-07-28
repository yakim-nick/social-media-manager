import fs from 'node:fs';
import { createServer } from './server/http.js';
import { router, middlewares } from './app.js';
import { errorHandler } from './middleware/errorHandler.js';
import config from './config/index.js';
import prisma from './utils/prisma.js';

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const server = createServer({
  port: config.port,
  middlewares,
  router,
  onError: errorHandler,
});

server.listen(config.port, () => {
  console.log(`[server] Running on port ${config.port} in ${config.env} mode`);
});

function shutdown(signal) {
  console.log(`\n[server] Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    console.log('[server] HTTP server closed');
    await prisma.$disconnect();
    console.log('[server] Database connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
