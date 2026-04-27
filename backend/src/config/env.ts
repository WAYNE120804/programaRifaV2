import path from 'node:path';

import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3002),
  databaseUrl: process.env.DATABASE_URL || '',
  authSecret: process.env.AUTH_SECRET || 'almacen-dev-secret-change-me',
  authTtlSeconds: Number(process.env.AUTH_TTL_SECONDS || 60 * 60 * 12),
  bootstrapAdminName: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador Principal',
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@almacen.local',
  bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin123*',
};
