import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';
import {
  getProducto,
  getProductos,
  getProductoVariantes,
  patchProductoEstado,
  postProducto,
  putProducto,
} from './producto.controller';

export const productoRouter = Router();

productoRouter.get('/', getProductos);
productoRouter.get('/variantes', getProductoVariantes);
productoRouter.get('/:id', getProducto);
productoRouter.post('/', requireRole(RolUsuario.ADMIN), postProducto);
productoRouter.put('/:id', requireRole(RolUsuario.ADMIN), putProducto);
productoRouter.patch('/:id/estado', requireRole(RolUsuario.ADMIN), patchProductoEstado);
