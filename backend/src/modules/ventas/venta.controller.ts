import type { NextFunction, Request, Response } from 'express';

import { createVenta, getVentaById, listVentas } from './venta.service';
import { parseVentaPayload } from './venta.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getVentas(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await listVentas({
        search: String(req.query.search || ''),
        estado: typeof req.query.estado === 'string' ? req.query.estado : '',
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getVenta(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getVentaById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postVenta(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createVenta(parseVentaPayload(req.body || {}), req.authUser?.id));
  } catch (error) {
    next(error);
  }
}
