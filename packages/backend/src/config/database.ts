import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

// Create a singleton instance to avoid exhausting connections
// during hot reloading in development.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Shutting down Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});
