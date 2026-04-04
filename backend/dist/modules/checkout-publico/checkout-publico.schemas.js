"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReservaCheckoutPayload = parseReservaCheckoutPayload;
exports.parseTransactionId = parseTransactionId;
exports.parseReservaId = parseReservaId;
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new app_error_1.AppError(`El campo "${field}" es obligatorio.`, 400);
    }
    return value.trim();
}
function parseOptionalEmail(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const normalized = trimmed.toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
        throw new app_error_1.AppError('El email no tiene un formato valido.', 400);
    }
    return normalized;
}
function parseReservaCheckoutPayload(input) {
    const boletaIds = Array.isArray(input.boletaIds)
        ? input.boletaIds
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
    if (!boletaIds.length) {
        throw new app_error_1.AppError('Debes seleccionar al menos una boleta para continuar.', 400);
    }
    if (!input.cliente || typeof input.cliente !== 'object') {
        throw new app_error_1.AppError('Los datos del cliente son obligatorios.', 400);
    }
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
        boletaIds,
        cliente: {
            nombre: parseRequiredString(input.cliente.nombre, 'nombre'),
            telefono: parseRequiredString(input.cliente.telefono, 'telefono'),
            documento: parseRequiredString(input.cliente.documento, 'documento'),
            email: parseOptionalEmail(input.cliente.email),
        },
    };
}
function parseTransactionId(value) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new app_error_1.AppError('El id de la transaccion es obligatorio.', 400);
    }
    return value.trim();
}
function parseReservaId(input) {
    if (typeof input.reservaId !== 'string' || !input.reservaId.trim()) {
        throw new app_error_1.AppError('El id de la reserva es obligatorio.', 400);
    }
    return input.reservaId.trim();
}
