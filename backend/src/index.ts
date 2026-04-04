import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { ensureBootstrapAdmin } from './modules/auth/auth.service';

async function start() {
  await ensureBootstrapAdmin();

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`Servidor backend escuchando en http://localhost:${env.port}`);
    logger.info(
      `Usuario admin inicial: ${env.bootstrapAdminEmail} / ${env.bootstrapAdminPassword}`
    );
  });
}

start().catch((error) => {
  logger.error('No fue posible iniciar el backend.', error);
  process.exit(1);
});
