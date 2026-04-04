"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAnularAbono = exports.postAbonoRifaVendedor = exports.getAbonosRifaVendedor = void 0;
exports.getAllRifaVendedores = getAllRifaVendedores;
exports.getRifaVendedor = getRifaVendedor;
exports.postRifaVendedor = postRifaVendedor;
exports.removeRifaVendedor = removeRifaVendedor;
exports.putRifaVendedor = putRifaVendedor;
exports.getAsignacionesRifaVendedor = getAsignacionesRifaVendedor;
exports.postAsignacionRifaVendedor = postAsignacionRifaVendedor;
exports.getDevolucionesRifaVendedor = getDevolucionesRifaVendedor;
exports.postDevolucionRifaVendedor = postDevolucionRifaVendedor;
const abono_controller_1 = require("../abonos/abono.controller");
Object.defineProperty(exports, "getAbonosRifaVendedor", { enumerable: true, get: function () { return abono_controller_1.getAbonosRifaVendedor; } });
Object.defineProperty(exports, "postAnularAbono", { enumerable: true, get: function () { return abono_controller_1.postAnularAbono; } });
Object.defineProperty(exports, "postAbonoRifaVendedor", { enumerable: true, get: function () { return abono_controller_1.postAbonoRifaVendedor; } });
const rifa_vendedor_service_1 = require("./rifa-vendedor.service");
const rifa_vendedor_schemas_1 = require("./rifa-vendedor.schemas");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllRifaVendedores(req, res, next) {
    try {
        const data = await (0, rifa_vendedor_service_1.listRifaVendedores)({
            rifaId: getStringParam(req.query.rifaId),
            vendedorId: getStringParam(req.query.vendedorId),
        });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getRifaVendedor(req, res, next) {
    try {
        res.json(await (0, rifa_vendedor_service_1.getRifaVendedorById)(getStringParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
async function postRifaVendedor(req, res, next) {
    try {
        const payload = (0, rifa_vendedor_schemas_1.parseRifaVendedorPayload)(req.body);
        const data = await (0, rifa_vendedor_service_1.createRifaVendedor)(payload);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
async function removeRifaVendedor(req, res, next) {
    try {
        await (0, rifa_vendedor_service_1.deleteRifaVendedor)(getStringParam(req.params.id));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
async function putRifaVendedor(req, res, next) {
    try {
        const payload = (0, rifa_vendedor_schemas_1.parseRifaVendedorUpdatePayload)(req.body);
        const data = await (0, rifa_vendedor_service_1.updateRifaVendedor)(getStringParam(req.params.id), payload);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getAsignacionesRifaVendedor(req, res, next) {
    try {
        const data = await (0, rifa_vendedor_service_1.listAsignacionesByRifaVendedor)(getStringParam(req.params.id), {
            usuarioId: getStringParam(req.query.usuarioId),
        });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postAsignacionRifaVendedor(req, res, next) {
    try {
        const payload = (0, rifa_vendedor_schemas_1.parseCreateAsignacionPayload)(req.body);
        const data = await (0, rifa_vendedor_service_1.createAsignacion)(getStringParam(req.params.id), payload, req.authUser?.id);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getDevolucionesRifaVendedor(req, res, next) {
    try {
        const data = await (0, rifa_vendedor_service_1.listDevolucionesByRifaVendedor)(getStringParam(req.params.id), {
            usuarioId: getStringParam(req.query.usuarioId),
        });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postDevolucionRifaVendedor(req, res, next) {
    try {
        const payload = (0, rifa_vendedor_schemas_1.parseCreateDevolucionPayload)(req.body);
        const data = await (0, rifa_vendedor_service_1.createDevolucion)(getStringParam(req.params.id), payload, req.authUser?.id);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
