import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { authenticateRequest, requireRole } from '../../middlewares/auth';
import {
  getMe,
  getUsuarios,
  patchUsuarioActivo,
  postLogin,
  postUsuario,
} from './auth.controller';

export const authRouter = Router();
export const usuarioRouter = Router();

authRouter.post('/login', postLogin);
authRouter.get('/me', authenticateRequest, getMe);

usuarioRouter.use(authenticateRequest);
usuarioRouter.get('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), getUsuarios);
usuarioRouter.post('/', requireRole(RolUsuario.ADMIN), postUsuario);
usuarioRouter.patch('/:id/activo', requireRole(RolUsuario.ADMIN), patchUsuarioActivo);
