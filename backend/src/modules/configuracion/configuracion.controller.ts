import type { NextFunction, Request, Response } from 'express';

import {
  getConfiguracionSistema,
  updateConfiguracionSistema,
} from './configuracion.service';
import { parseConfiguracionPayload } from './configuracion.schemas';

export async function getConfiguracion(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getConfiguracionSistema());
  } catch (error) {
    next(error);
  }
}

export async function putConfiguracion(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseConfiguracionPayload(req.body);
    res.json(await updateConfiguracionSistema(payload));
  } catch (error) {
    next(error);
  }
}
