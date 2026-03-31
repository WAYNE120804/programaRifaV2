import { Router } from 'express';

import { getGastoRecibo, getGastoReciboPublico } from './gasto-recibo.controller';

export const gastoReciboRouter = Router();

gastoReciboRouter.get('/codigo/:codigo', getGastoReciboPublico);
gastoReciboRouter.get('/:id', getGastoRecibo);
