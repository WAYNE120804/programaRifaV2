import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Servidor backend escuchando en http://localhost:${env.port}`);
});
