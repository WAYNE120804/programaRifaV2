"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBoletas = getAllBoletas;
exports.getBoleta = getBoleta;
exports.putBoleta = putBoleta;
const boleta_service_1 = require("./boleta.service");
const boleta_schemas_1 = require("./boleta.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllBoletas(req, res, next) {
    try {
        const filters = (0, boleta_schemas_1.parseBoletaListFilters)(req.query);
        res.json(await (0, boleta_service_1.listBoletas)(filters));
    }
    catch (error) {
        next(error);
    }
}
async function getBoleta(req, res, next) {
    try {
        res.json(await (0, boleta_service_1.getBoletaById)(getIdParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
async function putBoleta(req, res, next) {
    try {
        const payload = (0, boleta_schemas_1.parseUpdateBoletaPayload)(req.body);
        res.json(await (0, boleta_service_1.updateBoleta)(getIdParam(req.params.id), payload));
    }
    catch (error) {
        next(error);
    }
}
