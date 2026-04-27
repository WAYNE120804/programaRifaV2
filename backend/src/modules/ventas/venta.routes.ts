import { Router } from 'express';

import { requireRole } from '../../middlewares/auth';
import { RolUsuario } from '../../lib/prisma-client';
import { getVenta, getVentas, postVenta } from './venta.controller';

export const ventaRouter = Router();

ventaRouter.get('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), getVentas);
ventaRouter.get('/:id', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), getVenta);
ventaRouter.post('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), postVenta);
