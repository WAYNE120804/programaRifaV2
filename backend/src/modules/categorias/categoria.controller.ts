import type { NextFunction, Request, Response } from 'express';

import {
  createCategoria,
  getCategoriaById,
  listCategorias,
  toggleCategoriaActiva,
  updateCategoria,
} from './categoria.service';
import { parseCategoriaPayload } from './categoria.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return false;
}

export async function getCategorias(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await listCategorias({
        search: String(req.query.search || ''),
        activa: typeof req.query.activa === 'string' ? req.query.activa : undefined,
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getCategoria(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getCategoriaById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postCategoria(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createCategoria(parseCategoriaPayload(req.body || {})));
  } catch (error) {
    next(error);
  }
}

export async function putCategoria(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await updateCategoria(getIdParam(req.params.id), parseCategoriaPayload(req.body || {}))
    );
  } catch (error) {
    next(error);
  }
}

export async function patchCategoriaActiva(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await toggleCategoriaActiva(getIdParam(req.params.id), parseBoolean(req.body?.activa))
    );
  } catch (error) {
    next(error);
  }
}
