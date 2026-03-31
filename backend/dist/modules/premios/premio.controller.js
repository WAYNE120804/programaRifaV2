"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPremiosByRifa = getPremiosByRifa;
exports.getPremio = getPremio;
exports.postPremio = postPremio;
exports.putPremio = putPremio;
exports.removePremio = removePremio;
exports.putPremioBoletas = putPremioBoletas;
const premio_service_1 = require("./premio.service");
const premio_schemas_1 = require("./premio.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getPremiosByRifa(req, res, next) {
    try {
        res.json(await (0, premio_service_1.listPremiosByRifa)(getIdParam(req.query.rifaId)));
    }
    catch (error) {
        next(error);
    }
}
async function getPremio(req, res, next) {
    try {
        res.json(await (0, premio_service_1.getPremioById)(getIdParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
async function postPremio(req, res, next) {
    try {
        const payload = (0, premio_schemas_1.parsePremioPayload)(req.body);
        res.status(201).json(await (0, premio_service_1.createPremio)(payload));
    }
    catch (error) {
        next(error);
    }
}
async function putPremio(req, res, next) {
    try {
        const payload = (0, premio_schemas_1.parsePremioPayload)(req.body);
        res.json(await (0, premio_service_1.updatePremio)(getIdParam(req.params.id), payload));
    }
    catch (error) {
        next(error);
    }
}
async function removePremio(req, res, next) {
    try {
        await (0, premio_service_1.deletePremio)(getIdParam(req.params.id));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
async function putPremioBoletas(req, res, next) {
    try {
        const payload = (0, premio_schemas_1.parsePremioBoletasPayload)(req.body);
        res.json(await (0, premio_service_1.updatePremioBoletas)(getIdParam(req.params.id), payload));
    }
    catch (error) {
        next(error);
    }
}
