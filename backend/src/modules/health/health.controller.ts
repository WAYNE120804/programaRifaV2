import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env';
import { getPrisma } from '../../lib/prisma';

export async function getHealth(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const now = new Date().toISOString();
    const checks = {
      api: 'ok',
      database: env.databaseUrl ? 'configured' : 'missing-database-url',
    };

    if (env.databaseUrl) {
      const prisma = getPrisma();

      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'ok';
      }
    }

    res.json({
      status: 'ok',
      timestamp: now,
      phase: 'fase-0',
      checks,
    });
  } catch (error) {
    next(error);
  }
}
