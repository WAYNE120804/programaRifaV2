"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postReservaCheckout = postReservaCheckout;
exports.postReservaWompiCheckout = postReservaWompiCheckout;
exports.getReservaCheckoutEstado = getReservaCheckoutEstado;
exports.postWompiWebhook = postWompiWebhook;
exports.postReservaWompiReconcile = postReservaWompiReconcile;
const checkout_publico_service_1 = require("./checkout-publico.service");
const app_error_1 = require("../../lib/app-error");
const checkout_publico_schemas_1 = require("./checkout-publico.schemas");
async function postReservaCheckout(req, res, next) {
    try {
        await (0, checkout_publico_service_1.releaseExpiredPublicReservations)();
        const payload = (0, checkout_publico_schemas_1.parseReservaCheckoutPayload)(req.body);
        res.status(201).json(await (0, checkout_publico_service_1.createReservaCheckout)(payload));
    }
    catch (error) {
        next(error);
    }
}
async function postReservaWompiCheckout(req, res, next) {
    try {
        await (0, checkout_publico_service_1.releaseExpiredPublicReservations)();
        const reservaId = (0, checkout_publico_schemas_1.parseReservaId)(req.params);
        res.json(await (0, checkout_publico_service_1.prepareReservaWompiCheckout)(reservaId));
    }
    catch (error) {
        next(error);
    }
}
async function getReservaCheckoutEstado(req, res, next) {
    try {
        await (0, checkout_publico_service_1.releaseExpiredPublicReservations)();
        const reservaId = (0, checkout_publico_schemas_1.parseReservaId)(req.params);
        res.json(await (0, checkout_publico_service_1.getReservaCheckoutStatus)(reservaId));
    }
    catch (error) {
        next(error);
    }
}
async function postWompiWebhook(req, res, next) {
    try {
        const result = await (0, checkout_publico_service_1.processWompiWebhookEvent)(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
async function postReservaWompiReconcile(req, res, next) {
    try {
        const reservaId = (0, checkout_publico_schemas_1.parseReservaId)(req.params);
        const transactionId = typeof req.body?.transactionId === 'string' ? req.body.transactionId.trim() : '';
        if (!transactionId) {
            throw new app_error_1.AppError('El id de transaccion de Wompi es obligatorio.', 400);
        }
        res.json(await (0, checkout_publico_service_1.reconcileWompiTransaction)(reservaId, transactionId));
    }
    catch (error) {
        next(error);
    }
}
