import type { NextFunction, Request, Response } from 'express';

import {
  anularGasto,
  createGasto,
  getGastoById,
  listGastos,
} from './gasto.service';
import { parseAnularGastoPayload, parseCreateGastoPayload } from './gasto.schemas';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllGastos(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listGastos({
      rifaId: getStringParam(req.query.rifaId as string | string[] | undefined),
      categoria: getStringParam(req.query.categoria as string | string[] | undefined),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getGasto(
  req: Request,
  res: Response,
  next: NextFunction
) {
    try {
      const data = await getGastoById(getStringParam(req.params.id));
      res.json(data);
    } catch (error) {
      next(error);
    }
}

export async function postGasto(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseCreateGastoPayload(req.body);
    const data = await createGasto(payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function postAnularGasto(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseAnularGastoPayload(req.body);
    await anularGasto(getStringParam(req.params.id), payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
