import type { NextFunction, Request, Response } from 'express';
import {
  createReservaCheckout,
  getReservaCheckoutStatus,
  prepareReservaWompiCheckout,
  processWompiWebhookEvent,
  reconcileWompiTransaction,
  releaseExpiredPublicReservations,
} from './checkout-publico.service';
import { AppError } from '../../lib/app-error';
import { parseReservaCheckoutPayload, parseReservaId } from './checkout-publico.schemas';

export async function postReservaCheckout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await releaseExpiredPublicReservations();
    const payload = parseReservaCheckoutPayload(req.body);
    res.status(201).json(await createReservaCheckout(payload));
  } catch (error) {
    next(error);
  }
}

export async function postReservaWompiCheckout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await releaseExpiredPublicReservations();
    const reservaId = parseReservaId(req.params);
    res.json(await prepareReservaWompiCheckout(reservaId));
  } catch (error) {
    next(error);
  }
}

export async function getReservaCheckoutEstado(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await releaseExpiredPublicReservations();
    const reservaId = parseReservaId(req.params);
    res.json(await getReservaCheckoutStatus(reservaId));
  } catch (error) {
    next(error);
  }
}

export async function postWompiWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await processWompiWebhookEvent(req.body as Record<string, unknown>);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function postReservaWompiReconcile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const reservaId = parseReservaId(req.params);
    const transactionId =
      typeof req.body?.transactionId === 'string' ? req.body.transactionId.trim() : '';

    if (!transactionId) {
      throw new AppError('El id de transaccion de Wompi es obligatorio.', 400);
    }

    res.json(await reconcileWompiTransaction(reservaId, transactionId));
  } catch (error) {
    next(error);
  }
}
