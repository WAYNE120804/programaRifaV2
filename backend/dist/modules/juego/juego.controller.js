"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJuego = getJuego;
exports.putJuegoRifaVendedor = putJuegoRifaVendedor;
const juego_service_1 = require("./juego.service");
const juego_schemas_1 = require("./juego.schemas");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getJuego(req, res, next) {
    try {
        const filters = (0, juego_schemas_1.parseJuegoListFilters)(req.query);
        res.json(await (0, juego_service_1.listJuego)(filters));
    }
    catch (error) {
        next(error);
    }
}
async function putJuegoRifaVendedor(req, res, next) {
    try {
        const payload = (0, juego_schemas_1.parseActualizarJuegoPayload)(req.body);
        res.json(await (0, juego_service_1.actualizarJuegoRifaVendedor)(getStringParam(req.params.id), payload));
    }
    catch (error) {
        next(error);
    }
}
