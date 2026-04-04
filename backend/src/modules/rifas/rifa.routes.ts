import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAllRifas,
  getRifa,
  postRifa,
  putRifa,
  removeRifa,
} from './rifa.controller';

export const rifaRouter = Router();

rifaRouter.get('/', getAllRifas);
rifaRouter.get('/:id', getRifa);
rifaRouter.post('/', requireRole(RolUsuario.ADMIN), postRifa);
rifaRouter.put('/:id', requireRole(RolUsuario.ADMIN), putRifa);
rifaRouter.delete('/:id', requireRole(RolUsuario.ADMIN), removeRifa);
