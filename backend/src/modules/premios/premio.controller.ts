import type { NextFunction, Request, Response } from 'express';
import {
  createPremio,
  deletePremio,
  getPremioById,
  listPremiosByRifa,
  updatePremio,
  updatePremioBoletas,
} from './premio.service';
import { parsePremioBoletasPayload, parsePremioPayload } from './premio.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getPremiosByRifa(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listPremiosByRifa(getIdParam(req.query.rifaId as string | string[] | undefined)));
  } catch (error) {
    next(error);
  }
}

export async function getPremio(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getPremioById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postPremio(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parsePremioPayload(req.body);
    res.status(201).json(await createPremio(payload));
  } catch (error) {
    next(error);
  }
}

export async function putPremio(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parsePremioPayload(req.body);
    res.json(await updatePremio(getIdParam(req.params.id), payload));
  } catch (error) {
    next(error);
  }
}

export async function removePremio(req: Request, res: Response, next: NextFunction) {
  try {
    await deletePremio(getIdParam(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function putPremioBoletas(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parsePremioBoletasPayload(req.body);
    res.json(await updatePremioBoletas(getIdParam(req.params.id), payload));
  } catch (error) {
    next(error);
  }
}
