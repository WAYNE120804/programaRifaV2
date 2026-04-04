import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAllCajas,
  getCaja,
  getCajaResumen,
  postPrepareWebChannel,
  getSubCajas,
  postSubCaja,
  removeSubCaja,
} from './caja.controller';

export const cajaRouter = Router();
export const subCajaRouter = Router();

cajaRouter.get('/', requireRole(RolUsuario.ADMIN), getAllCajas);
cajaRouter.get('/resumen', requireRole(RolUsuario.ADMIN), getCajaResumen);
cajaRouter.post('/preparar-canal-web', requireRole(RolUsuario.ADMIN), postPrepareWebChannel);
cajaRouter.get('/:id', requireRole(RolUsuario.ADMIN), getCaja);

subCajaRouter.get('/', requireRole(RolUsuario.ADMIN), getSubCajas);
subCajaRouter.post('/', requireRole(RolUsuario.ADMIN), postSubCaja);
subCajaRouter.delete('/:id', requireRole(RolUsuario.ADMIN), removeSubCaja);
