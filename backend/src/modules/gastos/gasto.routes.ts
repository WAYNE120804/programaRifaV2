import { Router } from 'express';

import { getAllGastos, getGasto, postAnularGasto, postGasto } from './gasto.controller';

export const gastoRouter = Router();

gastoRouter.get('/', getAllGastos);
gastoRouter.get('/:id', getGasto);
gastoRouter.post('/', postGasto);
gastoRouter.post('/:id/anular', postAnularGasto);
