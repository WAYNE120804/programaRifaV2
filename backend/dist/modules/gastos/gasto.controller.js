"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGastos = getGastos;
exports.postGasto = postGasto;
exports.getGasto = getGasto;
const gasto_service_1 = require("./gasto.service");
const gasto_schemas_1 = require("./gasto.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getGastos(_req, res, next) {
    try {
        res.json(await (0, gasto_service_1.listGastos)());
    }
    catch (error) {
        next(error);
    }
}
async function postGasto(req, res, next) {
    try {
        res.status(201).json(await (0, gasto_service_1.registrarGasto)((0, gasto_schemas_1.parseGastoPayload)(req.body || {}), req.authUser?.id));
    }
    catch (error) {
        next(error);
    }
}
async function getGasto(req, res, next) {
    try {
        res.json(await (0, gasto_service_1.getGastoById)(getIdParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
