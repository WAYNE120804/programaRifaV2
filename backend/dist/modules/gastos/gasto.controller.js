"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGastos = getAllGastos;
exports.getGasto = getGasto;
exports.postGasto = postGasto;
exports.postAnularGasto = postAnularGasto;
const gasto_service_1 = require("./gasto.service");
const gasto_schemas_1 = require("./gasto.schemas");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllGastos(req, res, next) {
    try {
        const data = await (0, gasto_service_1.listGastos)({
            rifaId: getStringParam(req.query.rifaId),
            categoria: getStringParam(req.query.categoria),
            usuarioId: getStringParam(req.query.usuarioId),
        });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getGasto(req, res, next) {
    try {
        const data = await (0, gasto_service_1.getGastoById)(getStringParam(req.params.id));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postGasto(req, res, next) {
    try {
        const payload = (0, gasto_schemas_1.parseCreateGastoPayload)(req.body);
        const data = await (0, gasto_service_1.createGasto)(payload, req.authUser?.id);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postAnularGasto(req, res, next) {
    try {
        const payload = (0, gasto_schemas_1.parseAnularGastoPayload)(req.body);
        await (0, gasto_service_1.anularGasto)(getStringParam(req.params.id), payload, req.authUser?.id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
