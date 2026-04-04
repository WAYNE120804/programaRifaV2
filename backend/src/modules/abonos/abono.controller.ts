import type { NextFunction, Request, Response } from 'express';

import {
  anularAbono,
  createAbono,
  listAbonosByRifaVendedor,
} from './abono.service';
import { parseAnularAbonoPayload, parseCreateAbonoPayload } from './abono.schemas';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAbonosRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listAbonosByRifaVendedor(getStringParam(req.params.id), {
      usuarioId: getStringParam(req.query.usuarioId as string | string[] | undefined),
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function postAbonoRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseCreateAbonoPayload(req.body);
    const data = await createAbono(
      getStringParam(req.params.id),
      payload,
      req.authUser?.id
    );
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function postAnularAbono(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseAnularAbonoPayload(req.body);
    await anularAbono(getStringParam(req.params.abonoId), payload, req.authUser?.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
