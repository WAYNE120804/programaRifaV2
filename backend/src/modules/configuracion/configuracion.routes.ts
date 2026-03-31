import { Router } from 'express';

import { getConfiguracion, putConfiguracion } from './configuracion.controller';

export const configuracionRouter = Router();

configuracionRouter.get('/', getConfiguracion);
configuracionRouter.put('/', putConfiguracion);
