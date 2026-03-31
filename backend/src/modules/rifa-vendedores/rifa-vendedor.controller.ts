import type { NextFunction, Request, Response } from 'express';

import {
  getAbonosRifaVendedor,
  postAnularAbono,
  postAbonoRifaVendedor,
} from '../abonos/abono.controller';
import {
  createAsignacion,
  createDevolucion,
  createRifaVendedor,
  deleteRifaVendedor,
  getRifaVendedorById,
  listAsignacionesByRifaVendedor,
  listDevolucionesByRifaVendedor,
  listRifaVendedores,
  updateRifaVendedor,
} from './rifa-vendedor.service';
import {
  parseCreateAsignacionPayload,
  parseCreateDevolucionPayload,
  parseRifaVendedorPayload,
  parseRifaVendedorUpdatePayload,
} from './rifa-vendedor.schemas';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllRifaVendedores(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listRifaVendedores({
      rifaId: getStringParam(req.query.rifaId as string | string[] | undefined),
      vendedorId: getStringParam(
        req.query.vendedorId as string | string[] | undefined
      ),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getRifaVendedorById(getStringParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseRifaVendedorPayload(req.body);
    const data = await createRifaVendedor(payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function removeRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteRifaVendedor(getStringParam(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function putRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseRifaVendedorUpdatePayload(req.body);
    const data = await updateRifaVendedor(getStringParam(req.params.id), payload);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getAsignacionesRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listAsignacionesByRifaVendedor(getStringParam(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function postAsignacionRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseCreateAsignacionPayload(req.body);
    const data = await createAsignacion(getStringParam(req.params.id), payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDevolucionesRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listDevolucionesByRifaVendedor(getStringParam(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function postDevolucionRifaVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseCreateDevolucionPayload(req.body);
    const data = await createDevolucion(getStringParam(req.params.id), payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export { getAbonosRifaVendedor, postAbonoRifaVendedor, postAnularAbono };
