import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client instance.
 *
 * Logging is limited to warnings and errors; in development the warn level
 * is enabled to surface potential query issues.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;