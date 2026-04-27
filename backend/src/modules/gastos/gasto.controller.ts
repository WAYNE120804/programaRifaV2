import type { NextFunction, Request, Response } from 'express';

import { getGastoById, listGastos, registrarGasto } from './gasto.service';
import { parseGastoPayload } from './gasto.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getGastos(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listGastos());
  } catch (error) {
    next(error);
  }
}

export async function postGasto(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await registrarGasto(parseGastoPayload(req.body || {}), req.authUser?.id));
  } catch (error) {
    next(error);
  }
}

export async function getGasto(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getGastoById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}
