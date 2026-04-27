import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import {
  getCategoria,
  getCategorias,
  patchCategoriaActiva,
  postCategoria,
  putCategoria,
} from './categoria.controller';

export const categoriaRouter = Router();

categoriaRouter.get('/', getCategorias);
categoriaRouter.get('/:id', getCategoria);
categoriaRouter.post('/', requireRole(RolUsuario.ADMIN), postCategoria);
categoriaRouter.put('/:id', requireRole(RolUsuario.ADMIN), putCategoria);
categoriaRouter.patch('/:id/activa', requireRole(RolUsuario.ADMIN), patchCategoriaActiva);
