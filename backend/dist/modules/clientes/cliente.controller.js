"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientes = getClientes;
exports.getCliente = getCliente;
exports.postCliente = postCliente;
exports.putCliente = putCliente;
const cliente_service_1 = require("./cliente.service");
const cliente_schemas_1 = require("./cliente.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getClientes(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.listClientes)({
            search: String(req.query.search || ''),
        }));
    }
    catch (error) {
        next(error);
    }
}
async function getCliente(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.getClienteById)(getIdParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
async function postCliente(req, res, next) {
    try {
        res.status(201).json(await (0, cliente_service_1.createCliente)((0, cliente_schemas_1.parseClientePayload)(req.body || {}), req.authUser?.id));
    }
    catch (error) {
        next(error);
    }
}
async function putCliente(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.updateCliente)(getIdParam(req.params.id), (0, cliente_schemas_1.parseClientePayload)(req.body || {})));
    }
    catch (error) {
        next(error);
    }
}
