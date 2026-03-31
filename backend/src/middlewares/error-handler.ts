import type { NextFunction, Request, Response } from 'express';

import { logger } from '../lib/logger';

type AppError = Error & {
  statusCode?: number;
  status?: number;
  errorCode?: string;
  details?: unknown;
  type?: string;
};

export function errorHandler(
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Unhandled error', error);

  const statusCode = error.statusCode || error.status || 500;
  const isPayloadTooLarge =
    statusCode === 413 || error.type === 'entity.too.large';
  const message =
    isPayloadTooLarge
      ? 'La imagen es demasiado pesada. Intenta con un logo mas liviano.'
      : statusCode >= 500
        ? 'Error interno del servidor'
        : error.message;

  res.status(statusCode).json({
    status: 'error',
    message,
    error: message,
    code: error.errorCode,
    details: error.details,
  });
}
