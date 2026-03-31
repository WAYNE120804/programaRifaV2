import { Router } from 'express';
import {
  getPremio,
  getPremiosByRifa,
  postPremio,
  putPremio,
  putPremioBoletas,
  removePremio,
} from './premio.controller';

export const premioRouter = Router();

premioRouter.get('/', getPremiosByRifa);
premioRouter.get('/:id', getPremio);
premioRouter.post('/', postPremio);
premioRouter.put('/:id', putPremio);
premioRouter.put('/:id/boletas', putPremioBoletas);
premioRouter.delete('/:id', removePremio);
