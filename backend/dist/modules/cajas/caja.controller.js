"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCajaDiariaActual = getCajaDiariaActual;
exports.postAperturaCajaDiaria = postAperturaCajaDiaria;
exports.postCierreCajaDiaria = postCierreCajaDiaria;
exports.getCajaGeneralActual = getCajaGeneralActual;
exports.postTrasladoCajaGeneral = postTrasladoCajaGeneral;
exports.postSalidaCajaGeneral = postSalidaCajaGeneral;
const caja_service_1 = require("./caja.service");
const caja_schemas_1 = require("./caja.schemas");
async function getCajaDiariaActual(req, res, next) {
    try {
        const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;
        res.json(await (0, caja_service_1.getCajaDiaria)(fecha));
    }
    catch (error) {
        next(error);
    }
}
async function postAperturaCajaDiaria(req, res, next) {
    try {
        res.status(201).json(await (0, caja_service_1.abrirCajaDiaria)((0, caja_schemas_1.parseAperturaCajaPayload)(req.body || {}), req.authUser?.id));
    }
    catch (error) {
        next(error);
    }
}
async function postCierreCajaDiaria(req, res, next) {
    try {
        res.json(await (0, caja_service_1.cerrarCajaDiaria)((0, caja_schemas_1.parseCierreCajaPayload)(req.body || {}), req.authUser?.id));
    }
    catch (error) {
        next(error);
    }
}
async function getCajaGeneralActual(_req, res, next) {
    try {
        res.json(await (0, caja_service_1.getCajaGeneral)());
    }
    catch (error) {
        next(error);
    }
}
async function postTrasladoCajaGeneral(req, res, next) {
    try {
        res.status(201).json(await (0, caja_service_1.trasladarDesdeCajaDiaria)((0, caja_schemas_1.parseTrasladoCajaGeneralPayload)(req.body || {}), req.authUser?.id));
    }
    catch (error) {
        next(error);
    }
}
async function postSalidaCajaGeneral(req, res, next) {
    try {
        res.status(201).json(await (0, caja_service_1.registrarSalidaCajaGeneral)((0, caja_schemas_1.parseSalidaCajaGeneralPayload)(req.body || {}), req.authUser?.id));
    }
    catch (error) {
        next(error);
    }
}
