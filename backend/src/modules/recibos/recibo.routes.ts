import { Router } from 'express';

import { getRecibo, getReciboPublico } from './recibo.controller';

export const reciboRouter = Router();

reciboRouter.get('/codigo/:codigo', getReciboPublico);
reciboRouter.get('/:id', getRecibo);
