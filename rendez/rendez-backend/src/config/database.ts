import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Connection pool: max 10 connections, 10s pool timeout, 20s connect timeout
// Render free tier has 97 max connections on the shared Postgres instance
const DATABASE_URL_WITH_POOL = env.DATABASE_URL.includes('?')
  ? `${env.DATABASE_URL}&connection_limit=10&pool_timeout=10&connect_timeout=20`
  : `${env.DATABASE_URL}?connection_limit=10&pool_timeout=10&connect_timeout=20`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: DATABASE_URL_WITH_POOL } },
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
