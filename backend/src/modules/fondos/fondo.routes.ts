import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import { getFondos, postApartadoFondo, postFondo, putFondo, removeFondo } from './fondo.controller';

export const fondoRouter = Router();

fondoRouter.get('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), getFondos);
fondoRouter.post('/', requireRole(RolUsuario.ADMIN), postFondo);
fondoRouter.put('/:id', requireRole(RolUsuario.ADMIN), putFondo);
fondoRouter.delete('/:id', requireRole(RolUsuario.ADMIN), removeFondo);
fondoRouter.post('/apartados', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), postApartadoFondo);
