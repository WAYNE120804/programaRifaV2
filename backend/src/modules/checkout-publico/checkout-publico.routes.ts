import { Router } from 'express';
import {
  getReservaCheckoutEstado,
  postReservaCheckout,
  postReservaWompiCheckout,
  postReservaWompiReconcile,
  postWompiWebhook,
} from './checkout-publico.controller';

export const checkoutPublicoRouter = Router();

checkoutPublicoRouter.post('/reservas', postReservaCheckout);
checkoutPublicoRouter.get('/reservas/:reservaId', getReservaCheckoutEstado);
checkoutPublicoRouter.post('/reservas/:reservaId/wompi', postReservaWompiCheckout);
checkoutPublicoRouter.post('/reservas/:reservaId/wompi/reconcile', postReservaWompiReconcile);
checkoutPublicoRouter.post('/wompi/webhook', postWompiWebhook);
