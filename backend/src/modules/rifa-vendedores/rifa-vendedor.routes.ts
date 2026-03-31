import { Router } from 'express';

import {
  getAbonosRifaVendedor,
  getAsignacionesRifaVendedor,
  getDevolucionesRifaVendedor,
  getAllRifaVendedores,
  getRifaVendedor,
  postAnularAbono,
  postAbonoRifaVendedor,
  postAsignacionRifaVendedor,
  postDevolucionRifaVendedor,
  postRifaVendedor,
  putRifaVendedor,
  removeRifaVendedor,
} from './rifa-vendedor.controller';

export const rifaVendedorRouter = Router();

rifaVendedorRouter.get('/', getAllRifaVendedores);
rifaVendedorRouter.get('/:id/asignaciones', getAsignacionesRifaVendedor);
rifaVendedorRouter.post('/:id/asignaciones', postAsignacionRifaVendedor);
rifaVendedorRouter.get('/:id/devoluciones', getDevolucionesRifaVendedor);
rifaVendedorRouter.post('/:id/devoluciones', postDevolucionRifaVendedor);
rifaVendedorRouter.get('/:id/abonos', getAbonosRifaVendedor);
rifaVendedorRouter.post('/:id/abonos', postAbonoRifaVendedor);
rifaVendedorRouter.post('/:id/abonos/:abonoId/anular', postAnularAbono);
rifaVendedorRouter.get('/:id', getRifaVendedor);
rifaVendedorRouter.post('/', postRifaVendedor);
rifaVendedorRouter.put('/:id', putRifaVendedor);
rifaVendedorRouter.delete('/:id', removeRifaVendedor);
