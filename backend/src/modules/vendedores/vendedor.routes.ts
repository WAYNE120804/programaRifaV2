import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAllVendedores,
  getVendedor,
  postVendedor,
  putVendedor,
  removeVendedor,
} from './vendedor.controller';

export const vendedorRouter = Router();

vendedorRouter.get('/', getAllVendedores);
vendedorRouter.get('/:id', getVendedor);
vendedorRouter.post('/', requireRole(RolUsuario.ADMIN), postVendedor);
vendedorRouter.put('/:id', requireRole(RolUsuario.ADMIN), putVendedor);
vendedorRouter.delete('/:id', requireRole(RolUsuario.ADMIN), removeVendedor);
