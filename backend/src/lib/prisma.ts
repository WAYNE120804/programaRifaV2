import { PrismaClient } from './prisma-client';

import { env } from '../config/env';

declare global {
  var prismaGlobal: PrismaClient | null | undefined;
}

const connectionString = env.databaseUrl || process.env.DATABASE_URL || undefined;

let prisma = globalThis.prismaGlobal || null;

export function getPrisma() {
  if (!connectionString) {
    return null;
  }

  if (!prisma) {
    prisma = new PrismaClient({
      log: ['warn', 'error'],
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      globalThis.prismaGlobal = prisma;
    }
  }

  return prisma;
}
