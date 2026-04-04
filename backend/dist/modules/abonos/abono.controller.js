"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbonosRifaVendedor = getAbonosRifaVendedor;
exports.postAbonoRifaVendedor = postAbonoRifaVendedor;
exports.postAnularAbono = postAnularAbono;
const abono_service_1 = require("./abono.service");
const abono_schemas_1 = require("./abono.schemas");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAbonosRifaVendedor(req, res, next) {
    try {
        const data = await (0, abono_service_1.listAbonosByRifaVendedor)(getStringParam(req.params.id), {
            usuarioId: getStringParam(req.query.usuarioId),
        });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postAbonoRifaVendedor(req, res, next) {
    try {
        const payload = (0, abono_schemas_1.parseCreateAbonoPayload)(req.body);
        const data = await (0, abono_service_1.createAbono)(getStringParam(req.params.id), payload, req.authUser?.id);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postAnularAbono(req, res, next) {
    try {
        const payload = (0, abono_schemas_1.parseAnularAbonoPayload)(req.body);
        await (0, abono_service_1.anularAbono)(getStringParam(req.params.abonoId), payload, req.authUser?.id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
