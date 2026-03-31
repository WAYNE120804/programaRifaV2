import cors from 'cors';
import express from 'express';

import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found-handler';
import { serializeResponse } from './middlewares/serialize-response';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(serializeResponse);

  app.get('/', (_req, res) => {
    res.json({
      name: 'Sistema de Rifas API',
      status: 'ok',
      phase: 'fase-0',
    });
  });

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
