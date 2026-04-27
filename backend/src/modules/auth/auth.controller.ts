import type { NextFunction, Request, Response } from 'express';

import {
  createUsuario,
  getAuthProfile,
  listUsuarios,
  loginUsuario,
  toggleUsuarioActivo,
} from './auth.service';
import { parseLoginPayload, parseUsuarioPayload } from './auth.schemas';

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

export async function postLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await loginUsuario(parseLoginPayload(req.body)));
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getAuthProfile(req.authUser!.id));
  } catch (error) {
    next(error);
  }
}

export async function getUsuarios(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await listUsuarios());
  } catch (error) {
    next(error);
  }
}

export async function postUsuario(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usuario = await createUsuario(parseUsuarioPayload(req.body));
    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

export async function patchUsuarioActivo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await toggleUsuarioActivo(getIdParam(req.params.id), parseBoolean(req.body?.activo))
    );
  } catch (error) {
    next(error);
  }
}
