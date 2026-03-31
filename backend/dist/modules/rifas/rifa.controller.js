"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRifas = getAllRifas;
exports.getRifa = getRifa;
exports.postRifa = postRifa;
exports.putRifa = putRifa;
exports.removeRifa = removeRifa;
const rifa_service_1 = require("./rifa.service");
const rifa_schemas_1 = require("./rifa.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllRifas(_req, res, next) {
    try {
        res.json(await (0, rifa_service_1.listRifas)());
    }
    catch (error) {
        next(error);
    }
}
async function getRifa(req, res, next) {
    try {
        res.json(await (0, rifa_service_1.getRifaById)(getIdParam(req.params.id)));
    }
    catch (error) {
        next(error);
    }
}
async function postRifa(req, res, next) {
    try {
        const payload = (0, rifa_schemas_1.parseRifaPayload)(req.body);
        const rifa = await (0, rifa_service_1.createRifa)(payload);
        res.status(201).json(rifa);
    }
    catch (error) {
        next(error);
    }
}
async function putRifa(req, res, next) {
    try {
        const payload = (0, rifa_schemas_1.parseRifaPayload)(req.body);
        const rifa = await (0, rifa_service_1.updateRifa)(getIdParam(req.params.id), payload);
        res.json(rifa);
    }
    catch (error) {
        next(error);
    }
}
async function removeRifa(req, res, next) {
    try {
        await (0, rifa_service_1.deleteRifa)(getIdParam(req.params.id));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
