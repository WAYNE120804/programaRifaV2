"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJuegoListFilters = parseJuegoListFilters;
exports.parseActualizarJuegoPayload = parseActualizarJuegoPayload;
const app_error_1 = require("../../lib/app-error");
function parseOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function parseJuegoListFilters(input) {
    const rifaId = parseOptionalString(input.rifaId);
    const premioId = parseOptionalString(input.premioId);
    if (!rifaId) {
        throw new app_error_1.AppError('La rifa es obligatoria para consultar el juego.', 400);
    }
    if (!premioId) {
        throw new app_error_1.AppError('El premio es obligatorio para consultar el juego.', 400);
    }
    return {
        rifaId,
        premioId,
        rifaVendedorId: parseOptionalString(input.rifaVendedorId),
        numero: parseOptionalString(input.numero),
    };
}
function parseActualizarJuegoPayload(input) {
    const premioId = parseOptionalString(input.premioId);
    const modo = parseOptionalString(input.modo)?.toUpperCase();
    if (!premioId) {
        throw new app_error_1.AppError('El premio es obligatorio para actualizar el juego.', 400);
    }
    if (!modo || !['LISTA', 'TODAS', 'NINGUNA'].includes(modo)) {
        throw new app_error_1.AppError('El modo de juego no es valido.', 400);
    }
    const numeros = Array.isArray(input.numeros)
        ? input.numeros
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
        : [];
    if (modo === 'LISTA' && numeros.length === 0) {
        throw new app_error_1.AppError('Debes enviar al menos una boleta para marcar juego por lista.', 400);
    }
    return {
        premioId,
        modo: modo,
        numeros,
    };
}
