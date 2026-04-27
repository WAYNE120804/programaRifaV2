import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import { getGasto, getGastos, postGasto } from './gasto.controller';

export const gastoRouter = Router();

gastoRouter.get('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), getGastos);
gastoRouter.get('/:id', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), getGasto);
gastoRouter.post('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), postGasto);
