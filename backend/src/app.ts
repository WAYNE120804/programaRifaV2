import cors from 'cors';
import express from 'express';

import { authenticateRequest } from './middlewares/auth';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found-handler';
import { serializeResponse } from './middlewares/serialize-response';
import { apiRouter } from './routes';

const publicApiRules = [
  { method: 'GET', pattern: /^\/api\/health(?:\/.*)?$/ },
  { method: 'POST', pattern: /^\/api\/auth\/login$/ },
  { method: 'GET', pattern: /^\/api\/auth\/me$/ },
  { method: 'GET', pattern: /^\/api\/configuracion$/ },
  { method: 'GET', pattern: /^\/api\/boletas\/publicas$/ },
  { method: 'GET', pattern: /^\/api\/rifas\/[^/]+$/ },
  { method: 'GET', pattern: /^\/api\/checkout-publico\/reservas\/[^/]+$/ },
  { method: 'POST', pattern: /^\/api\/checkout-publico\/reservas$/ },
  { method: 'POST', pattern: /^\/api\/checkout-publico\/reservas\/[^/]+\/wompi$/ },
  { method: 'POST', pattern: /^\/api\/checkout-publico\/reservas\/[^/]+\/wompi\/reconcile$/ },
  { method: 'POST', pattern: /^\/api\/checkout-publico\/wompi\/webhook$/ },
  { method: 'GET', pattern: /^\/api\/recibos\/codigo\/[^/]+$/ },
];

function isPublicApiRoute(method: string, path: string) {
  return publicApiRules.some(
    (rule) => rule.method === method.toUpperCase() && rule.pattern.test(path)
  );
}

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

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return next();
    }

    if (isPublicApiRoute(req.method, req.path)) {
      return next();
    }

    return authenticateRequest(req, res, next);
  });

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
