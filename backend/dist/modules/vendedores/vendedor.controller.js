"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVendedores = getAllVendedores;
exports.getVendedor = getVendedor;
exports.postVendedor = postVendedor;
exports.putVendedor = putVendedor;
exports.removeVendedor = removeVendedor;
const vendedor_service_1 = require("./vendedor.service");
const vendedor_schemas_1 = require("./vendedor.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllVendedores(_req, res, next) {
    try {
        res.json(await (0, vendedor_service_1.listVendedores)());
    }
    catch (error) {
        next(error);
    }
}
async function getVendedor(req, res, next) {
    try {
        res.json(await (0, vendedor_service_1.getVendedorById)(getIdParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
async function postVendedor(req, res, next) {
    try {
        const payload = (0, vendedor_schemas_1.parseVendedorPayload)(req.body);
        const vendedor = await (0, vendedor_service_1.createVendedor)(payload);
        res.status(201).json(vendedor);
    }
    catch (error) {
        next(error);
    }
}
async function putVendedor(req, res, next) {
    try {
        const payload = (0, vendedor_schemas_1.parseVendedorPayload)(req.body);
        const vendedor = await (0, vendedor_service_1.updateVendedor)(getIdParam(req.params.id), payload);
        res.json(vendedor);
    }
    catch (error) {
        next(error);
    }
}
async function removeVendedor(req, res, next) {
    try {
        await (0, vendedor_service_1.deleteVendedor)(getIdParam(req.params.id));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
