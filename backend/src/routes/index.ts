import { Router } from 'express';

import { boletaRouter } from '../modules/boletas/boleta.routes';
import { cajaRouter, subCajaRouter } from '../modules/cajas/caja.routes';
import { configuracionRouter } from '../modules/configuracion/configuracion.routes';
import { gastoReciboRouter } from '../modules/gasto-recibos/gasto-recibo.routes';
import { gastoRouter } from '../modules/gastos/gasto.routes';
import { healthRouter } from '../modules/health/health.routes';
import { juegoRouter } from '../modules/juego/juego.routes';
import { premioRouter } from '../modules/premios/premio.routes';
import { reciboRouter } from '../modules/recibos/recibo.routes';
import { rifaRouter } from '../modules/rifas/rifa.routes';
import { rifaVendedorRouter } from '../modules/rifa-vendedores/rifa-vendedor.routes';
import { vendedorRouter } from '../modules/vendedores/vendedor.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/juego', juegoRouter);
apiRouter.use('/premios', premioRouter);
apiRouter.use('/configuracion', configuracionRouter);
apiRouter.use('/boletas', boletaRouter);
apiRouter.use('/cajas', cajaRouter);
apiRouter.use('/subcajas', subCajaRouter);
apiRouter.use('/gasto-recibos', gastoReciboRouter);
apiRouter.use('/gastos', gastoRouter);
apiRouter.use('/recibos', reciboRouter);
apiRouter.use('/rifas', rifaRouter);
apiRouter.use('/rifa-vendedores', rifaVendedorRouter);
apiRouter.use('/vendedores', vendedorRouter);
