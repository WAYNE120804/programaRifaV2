import { Router } from 'express';

import { getAllBoletas, getBoleta, putBoleta } from './boleta.controller';

export const boletaRouter = Router();

boletaRouter.get('/', getAllBoletas);
boletaRouter.get('/:id', getBoleta);
boletaRouter.put('/:id', putBoleta);
