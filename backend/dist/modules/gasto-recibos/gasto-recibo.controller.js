"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGastoRecibo = getGastoRecibo;
exports.getGastoReciboPublico = getGastoReciboPublico;
const gasto_service_1 = require("../gastos/gasto.service");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getGastoRecibo(req, res, next) {
    try {
        const data = await (0, gasto_service_1.getGastoReciboById)(getStringParam(req.params.id));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getGastoReciboPublico(req, res, next) {
    try {
        const data = await (0, gasto_service_1.getGastoReciboByCodigo)(getStringParam(req.params.codigo));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
