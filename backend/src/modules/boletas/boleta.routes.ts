import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAllBoletas,
  getBoleta,
  getPublicBoletas,
  putBoleta,
} from './boleta.controller';

export const boletaRouter = Router();

boletaRouter.get('/', getAllBoletas);
boletaRouter.get('/publicas', getPublicBoletas);
boletaRouter.get('/:id', getBoleta);
boletaRouter.put('/:id', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), putBoleta);
