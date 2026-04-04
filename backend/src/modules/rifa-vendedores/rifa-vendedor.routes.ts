import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAbonosRifaVendedor,
  getAsignacionesRifaVendedor,
  getDevolucionesRifaVendedor,
  getAllRifaVendedores,
  getRifaVendedor,
  postAnularAbono,
  postAbonoRifaVendedor,
  postAsignacionRifaVendedor,
  postDevolucionRifaVendedor,
  postRifaVendedor,
  putRifaVendedor,
  removeRifaVendedor,
} from './rifa-vendedor.controller';

export const rifaVendedorRouter = Router();

rifaVendedorRouter.get('/', getAllRifaVendedores);
rifaVendedorRouter.get('/:id/asignaciones', getAsignacionesRifaVendedor);
rifaVendedorRouter.post(
  '/:id/asignaciones',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  postAsignacionRifaVendedor
);
rifaVendedorRouter.get('/:id/devoluciones', getDevolucionesRifaVendedor);
rifaVendedorRouter.post(
  '/:id/devoluciones',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  postDevolucionRifaVendedor
);
rifaVendedorRouter.get('/:id/abonos', getAbonosRifaVendedor);
rifaVendedorRouter.post(
  '/:id/abonos',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  postAbonoRifaVendedor
);
rifaVendedorRouter.post(
  '/:id/abonos/:abonoId/anular',
  requireRole(RolUsuario.ADMIN),
  postAnularAbono
);
rifaVendedorRouter.get('/:id', getRifaVendedor);
rifaVendedorRouter.post('/', requireRole(RolUsuario.ADMIN), postRifaVendedor);
rifaVendedorRouter.put('/:id', requireRole(RolUsuario.ADMIN), putRifaVendedor);
rifaVendedorRouter.delete('/:id', requireRole(RolUsuario.ADMIN), removeRifaVendedor);
