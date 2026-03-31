import { Router } from 'express';

import {
  getAllCajas,
  getCaja,
  getCajaResumen,
  getSubCajas,
  postSubCaja,
  removeSubCaja,
} from './caja.controller';

export const cajaRouter = Router();
export const subCajaRouter = Router();

cajaRouter.get('/', getAllCajas);
cajaRouter.get('/resumen', getCajaResumen);
cajaRouter.get('/:id', getCaja);

subCajaRouter.get('/', getSubCajas);
subCajaRouter.post('/', postSubCaja);
subCajaRouter.delete('/:id', removeSubCaja);
