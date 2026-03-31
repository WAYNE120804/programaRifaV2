import type { NextFunction, Request, Response } from 'express';

import {
  createSubCaja,
  deleteSubCaja,
  getCajaById,
  getCajaResumenByRifa,
  listCajas,
  listSubCajasByRifa,
} from './caja.service';
import { parseCreateSubCajaPayload } from './caja.schemas';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllCajas(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listCajas(getStringParam(req.query.rifaId as string | string[] | undefined));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getCaja(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getCajaById(getStringParam(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getCajaResumen(req: Request, res: Response, next: NextFunction) {
  try {
    const rifaId = getStringParam(req.query.rifaId as string | string[] | undefined);
    const data = await getCajaResumenByRifa(rifaId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getSubCajas(req: Request, res: Response, next: NextFunction) {
  try {
    const rifaId = getStringParam(req.query.rifaId as string | string[] | undefined);
    const data = await listSubCajasByRifa(rifaId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function postSubCaja(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parseCreateSubCajaPayload(req.body);
    const data = await createSubCaja(payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function removeSubCaja(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteSubCaja(getStringParam(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
