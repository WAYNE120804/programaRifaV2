import type { NextFunction, Request, Response } from 'express';

import { RolUsuario } from '../lib/prisma-client';
import { AppError } from '../lib/app-error';
import { verifyAuthToken } from '../lib/auth-token';
import { getPrisma } from '../lib/prisma';

type AuthenticatedUser = {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

function getBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

export async function authenticateRequest(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Debes iniciar sesion para acceder a esta ruta.', 401, {
        errorCode: 'AUTH_REQUIRED',
      });
    }

    const payload = verifyAuthToken(token);

    if (!payload) {
      throw new AppError('La sesion no es valida o ya expiro.', 401, {
        errorCode: 'INVALID_SESSION',
      });
    }

    const prisma = getPrisma();

    if (!prisma) {
      throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      throw new AppError('Tu usuario ya no tiene acceso al sistema.', 401, {
        errorCode: 'USER_DISABLED',
      });
    }

    req.authUser = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(
        new AppError('Debes iniciar sesion para acceder a esta ruta.', 401, {
          errorCode: 'AUTH_REQUIRED',
        })
      );
    }

    if (roles.length > 0 && !roles.includes(req.authUser.rol)) {
      return next(
        new AppError('No tienes permisos para realizar esta accion.', 403, {
          errorCode: 'FORBIDDEN',
        })
      );
    }

    return next();
  };
}
