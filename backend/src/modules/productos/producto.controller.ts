import type { NextFunction, Request, Response } from 'express';

import { EstadoProducto } from '../../lib/prisma-client';
import {
  createProducto,
  getProductoById,
  listProductos,
  listProductoVariantes,
  updateProducto,
  updateProductoEstado,
} from './producto.service';
import { parseProductoPayload } from './producto.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

function parseEstado(value: unknown) {
  if (typeof value === 'string' && value in EstadoProducto) {
    return value as EstadoProducto;
  }

  return EstadoProducto.ACTIVO;
}

export async function getProductos(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await listProductos({
        search: String(req.query.search || ''),
        categoriaId: typeof req.query.categoriaId === 'string' ? req.query.categoriaId : '',
        estado: typeof req.query.estado === 'string' ? req.query.estado : '',
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getProductoVariantes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await listProductoVariantes({
        search: String(req.query.search || ''),
        categoriaId: typeof req.query.categoriaId === 'string' ? req.query.categoriaId : '',
        estado: typeof req.query.estado === 'string' ? req.query.estado : '',
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getProducto(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getProductoById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postProducto(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createProducto(parseProductoPayload(req.body || {}), req.authUser?.id));
  } catch (error) {
    next(error);
  }
}

export async function putProducto(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await updateProducto(
        getIdParam(req.params.id),
        parseProductoPayload(req.body || {}),
        req.authUser?.id
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function patchProductoEstado(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await updateProductoEstado(getIdParam(req.params.id), parseEstado(req.body?.estado)));
  } catch (error) {
    next(error);
  }
}
