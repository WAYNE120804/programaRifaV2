"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGastoPayload = parseGastoPayload;
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
function parseOptionalString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim();
    return normalized ? normalized : null;
}
function parseRequiredString(value, fieldName) {
    const parsed = parseOptionalString(value);
    if (!parsed) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return parsed;
}
function parsePositiveMoney(value, fieldName) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser mayor a cero.`);
    }
    return parsed;
}
function parseOrigen(value) {
    if (typeof value === 'string' && value in prisma_client_1.OrigenGasto) {
        return value;
    }
    throw new app_error_1.AppError('Debes seleccionar un origen valido para el pago.');
}
function parseCategoria(value) {
    if (typeof value === 'string' && value in prisma_client_1.CategoriaGasto) {
        return value;
    }
    throw new app_error_1.AppError('Debes seleccionar un concepto valido para el gasto.');
}
function parseGastoPayload(input) {
    const origen = parseOrigen(input.origen);
    const fondoId = parseOptionalString(input.fondoId);
    if (origen === prisma_client_1.OrigenGasto.FONDO_META && !fondoId) {
        throw new app_error_1.AppError('Debes seleccionar el fondo/meta origen del pago.');
    }
    return {
        origen,
        fondoId,
        categoria: parseCategoria(input.categoria),
        descripcion: parseRequiredString(input.descripcion, 'descripcion'),
        valor: parsePositiveMoney(input.valor, 'valor'),
        soporte: parseOptionalString(input.soporte),
        observacion: parseOptionalString(input.observacion),
    };
}
