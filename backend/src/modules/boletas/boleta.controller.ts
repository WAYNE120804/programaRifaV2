import type { NextFunction, Request, Response } from 'express';

import {
  getBoletaById,
  listBoletas,
  updateBoleta,
} from './boleta.service';
import {
  parseBoletaListFilters,
  parseUpdateBoletaPayload,
} from './boleta.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllBoletas(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = parseBoletaListFilters(req.query);
    res.json(await listBoletas(filters));
  } catch (error) {
    next(error);
  }
}

export async function getBoleta(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getBoletaById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function putBoleta(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseUpdateBoletaPayload(req.body);
    res.json(await updateBoleta(getIdParam(req.params.id), payload));
  } catch (error) {
    next(error);
  }
}
