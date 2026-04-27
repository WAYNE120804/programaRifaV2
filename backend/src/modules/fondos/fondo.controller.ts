import type { NextFunction, Request, Response } from 'express';

import { deleteFondo, listFondos, registrarApartadoFondo, updateFondo, upsertFondo } from './fondo.service';
import {
  parseApartadoFondoPayload,
  parseDeleteFondoPayload,
  parseUpsertFondoPayload,
} from './fondo.schemas';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getFondos(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listFondos());
  } catch (error) {
    next(error);
  }
}

export async function postFondo(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await upsertFondo(parseUpsertFondoPayload(req.body || {})));
  } catch (error) {
    next(error);
  }
}

export async function putFondo(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await updateFondo(getStringParam(req.params.id), parseUpsertFondoPayload(req.body || {})));
  } catch (error) {
    next(error);
  }
}

export async function removeFondo(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await deleteFondo(
        getStringParam(req.params.id),
        parseDeleteFondoPayload(req.body || {}),
        req.authUser?.id
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function postApartadoFondo(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(
      await registrarApartadoFondo(parseApartadoFondoPayload(req.body || {}), req.authUser?.id)
    );
  } catch (error) {
    next(error);
  }
}
