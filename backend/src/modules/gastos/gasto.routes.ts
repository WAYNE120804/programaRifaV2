import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import { getAllGastos, getGasto, postAnularGasto, postGasto } from './gasto.controller';

export const gastoRouter = Router();

gastoRouter.get('/', requireRole(RolUsuario.ADMIN), getAllGastos);
gastoRouter.get('/:id', requireRole(RolUsuario.ADMIN), getGasto);
gastoRouter.post('/', requireRole(RolUsuario.ADMIN), postGasto);
gastoRouter.post('/:id/anular', requireRole(RolUsuario.ADMIN), postAnularGasto);
