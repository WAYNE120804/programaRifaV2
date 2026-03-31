"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecibo = getRecibo;
exports.getReciboPublico = getReciboPublico;
const abono_service_1 = require("../abonos/abono.service");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getRecibo(req, res, next) {
    try {
        const data = await (0, abono_service_1.getReciboById)(getStringParam(req.params.id));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getReciboPublico(req, res, next) {
    try {
        const data = await (0, abono_service_1.getReciboByCodigo)(getStringParam(req.params.codigo));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
