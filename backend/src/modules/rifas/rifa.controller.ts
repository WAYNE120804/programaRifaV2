import type { NextFunction, Request, Response } from 'express';

import {
  createRifa,
  deleteRifa,
  getRifaById,
  listRifas,
  updateRifa,
} from './rifa.service';
import { parseRifaPayload } from './rifa.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllRifas(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await listRifas());
  } catch (error) {
    next(error);
  }
}

export async function getRifa(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getRifaById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postRifa(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseRifaPayload(req.body);
    const rifa = await createRifa(payload);
    res.status(201).json(rifa);
  } catch (error) {
    next(error);
  }
}

export async function putRifa(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseRifaPayload(req.body);
    const rifa = await updateRifa(getIdParam(req.params.id), payload);
    res.json(rifa);
  } catch (error) {
    next(error);
  }
}

export async function removeRifa(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteRifa(getIdParam(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
