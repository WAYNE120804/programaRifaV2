import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import { getInformeGeneral } from './informe.controller';

export const informeRouter = Router();

informeRouter.get('/', requireRole(RolUsuario.ADMIN), getInformeGeneral);
