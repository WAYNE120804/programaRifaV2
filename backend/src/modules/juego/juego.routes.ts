import { Router } from 'express';

import { getJuego, putJuegoRifaVendedor } from './juego.controller';

export const juegoRouter = Router();

juegoRouter.get('/', getJuego);
juegoRouter.put('/rifa-vendedores/:id', putJuegoRifaVendedor);
