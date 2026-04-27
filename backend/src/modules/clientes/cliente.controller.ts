import type { NextFunction, Request, Response } from 'express';

import {
  createCliente,
  getClienteById,
  listClientes,
  updateCliente,
} from './cliente.service';
import { parseClientePayload } from './cliente.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getClientes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await listClientes({
        search: String(req.query.search || ''),
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getCliente(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getClienteById(getIdParam(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function postCliente(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createCliente(parseClientePayload(req.body || {}), req.authUser?.id));
  } catch (error) {
    next(error);
  }
}

export async function putCliente(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await updateCliente(getIdParam(req.params.id), parseClientePayload(req.body || {})));
  } catch (error) {
    next(error);
  }
}
