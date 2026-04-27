import { Router } from 'express';

import { requireRole } from '../../middlewares/auth';
import { RolUsuario } from '../../lib/prisma-client';
import {
  getCajaDiariaActual,
  getCajaGeneralActual,
  postAperturaCajaDiaria,
  postCierreCajaDiaria,
  postSalidaCajaGeneral,
  postTrasladoCajaGeneral,
} from './caja.controller';

export const cajaRouter = Router();

cajaRouter.get('/diaria', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), getCajaDiariaActual);
cajaRouter.get('/general', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), getCajaGeneralActual);
cajaRouter.post(
  '/diaria/apertura',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  postAperturaCajaDiaria
);
cajaRouter.post(
  '/diaria/cierre',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  postCierreCajaDiaria
);
cajaRouter.post(
  '/general/traslados',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  postTrasladoCajaGeneral
);
cajaRouter.post(
  '/general/salidas',
  requireRole(RolUsuario.ADMIN),
  postSalidaCajaGeneral
);
