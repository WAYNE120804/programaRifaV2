import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import { getJuego, putJuegoRifaVendedor } from './juego.controller';

export const juegoRouter = Router();

juegoRouter.get('/', getJuego);
juegoRouter.put(
  '/rifa-vendedores/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO),
  putJuegoRifaVendedor
);
