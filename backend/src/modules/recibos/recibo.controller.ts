import type { NextFunction, Request, Response } from 'express';

import { getReciboByCodigo, getReciboById } from '../abonos/abono.service';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getRecibo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getReciboById(getStringParam(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getReciboPublico(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getReciboByCodigo(getStringParam(req.params.codigo));
    res.json(data);
  } catch (error) {
    next(error);
  }
}
