"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguracion = getConfiguracion;
exports.putConfiguracion = putConfiguracion;
const configuracion_service_1 = require("./configuracion.service");
const configuracion_schemas_1 = require("./configuracion.schemas");
async function getConfiguracion(_req, res, next) {
    try {
        res.json(await (0, configuracion_service_1.getConfiguracionSistema)());
    }
    catch (error) {
        next(error);
    }
}
async function putConfiguracion(req, res, next) {
    try {
        const payload = (0, configuracion_schemas_1.parseConfiguracionPayload)(req.body);
        res.json(await (0, configuracion_service_1.updateConfiguracionSistema)(payload));
    }
    catch (error) {
        next(error);
    }
}
