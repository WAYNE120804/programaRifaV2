import { Router } from 'express';

import {
  getAllVendedores,
  getVendedor,
  postVendedor,
  putVendedor,
  removeVendedor,
} from './vendedor.controller';

export const vendedorRouter = Router();

vendedorRouter.get('/', getAllVendedores);
vendedorRouter.get('/:id', getVendedor);
vendedorRouter.post('/', postVendedor);
vendedorRouter.put('/:id', putVendedor);
vendedorRouter.delete('/:id', removeVendedor);
