import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import { getConfiguracion, putConfiguracion } from './configuracion.controller';

export const configuracionRouter = Router();

configuracionRouter.get('/', getConfiguracion);
configuracionRouter.put('/', requireRole(RolUsuario.ADMIN), putConfiguracion);
