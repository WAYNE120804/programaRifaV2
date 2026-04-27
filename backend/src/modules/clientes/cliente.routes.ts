import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import { getCliente, getClientes, postCliente, putCliente } from './cliente.controller';

export const clienteRouter = Router();

clienteRouter.get(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR),
  getClientes
);
clienteRouter.get(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR),
  getCliente
);
clienteRouter.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR),
  postCliente
);
clienteRouter.put(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR),
  putCliente
);
