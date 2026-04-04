import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import {
  getPremio,
  getPremiosByRifa,
  postPremio,
  putPremio,
  putPremioBoletas,
  removePremio,
} from './premio.controller';

export const premioRouter = Router();

premioRouter.get('/', getPremiosByRifa);
premioRouter.get('/:id', getPremio);
premioRouter.post('/', requireRole(RolUsuario.ADMIN), postPremio);
premioRouter.put('/:id', requireRole(RolUsuario.ADMIN), putPremio);
premioRouter.put('/:id/boletas', requireRole(RolUsuario.ADMIN), putPremioBoletas);
premioRouter.delete('/:id', requireRole(RolUsuario.ADMIN), removePremio);
