import type { NextFunction, Request, Response } from 'express';

import { getGastoReciboByCodigo, getGastoReciboById } from '../gastos/gasto.service';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getGastoRecibo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getGastoReciboById(getStringParam(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getGastoReciboPublico(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getGastoReciboByCodigo(getStringParam(req.params.codigo));
    res.json(data);
  } catch (error) {
    next(error);
  }
}
