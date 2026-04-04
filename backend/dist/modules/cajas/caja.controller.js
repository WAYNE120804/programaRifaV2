"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCajas = getAllCajas;
exports.getCaja = getCaja;
exports.getCajaResumen = getCajaResumen;
exports.getSubCajas = getSubCajas;
exports.postSubCaja = postSubCaja;
exports.removeSubCaja = removeSubCaja;
exports.postPrepareWebChannel = postPrepareWebChannel;
const caja_service_1 = require("./caja.service");
const caja_schemas_1 = require("./caja.schemas");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllCajas(req, res, next) {
    try {
        const data = await (0, caja_service_1.listCajas)(getStringParam(req.query.rifaId));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getCaja(req, res, next) {
    try {
        const data = await (0, caja_service_1.getCajaById)(getStringParam(req.params.id));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getCajaResumen(req, res, next) {
    try {
        const rifaId = getStringParam(req.query.rifaId);
        const data = await (0, caja_service_1.getCajaResumenByRifa)(rifaId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function getSubCajas(req, res, next) {
    try {
        const rifaId = getStringParam(req.query.rifaId);
        const data = await (0, caja_service_1.listSubCajasByRifa)(rifaId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function postSubCaja(req, res, next) {
    try {
        const payload = (0, caja_schemas_1.parseCreateSubCajaPayload)(req.body);
        const data = await (0, caja_service_1.createSubCaja)(payload);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
async function removeSubCaja(req, res, next) {
    try {
        await (0, caja_service_1.deleteSubCaja)(getStringParam(req.params.id));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
async function postPrepareWebChannel(req, res, next) {
    try {
        const payload = (0, caja_schemas_1.parsePrepareWebChannelPayload)(req.body);
        const data = await (0, caja_service_1.prepareWebChannelByRifa)(payload.rifaId);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
}
