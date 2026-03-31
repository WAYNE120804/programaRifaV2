import type { NextFunction, Request, Response } from 'express';

import { actualizarJuegoRifaVendedor, listJuego } from './juego.service';
import {
  parseActualizarJuegoPayload,
  parseJuegoListFilters,
} from './juego.schemas';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getJuego(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = parseJuegoListFilters(req.query);
    res.json(await listJuego(filters));
  } catch (error) {
    next(error);
  }
}

export async function putJuegoRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseActualizarJuegoPayload(req.body);
    res.json(await actualizarJuegoRifaVendedor(getStringParam(req.params.id), payload));
  } catch (error) {
    next(error);
  }
}
