import { Router } from 'express';

import {
  getAllRifas,
  getRifa,
  postRifa,
  putRifa,
  removeRifa,
} from './rifa.controller';

export const rifaRouter = Router();

rifaRouter.get('/', getAllRifas);
rifaRouter.get('/:id', getRifa);
rifaRouter.post('/', postRifa);
rifaRouter.put('/:id', putRifa);
rifaRouter.delete('/:id', removeRifa);
