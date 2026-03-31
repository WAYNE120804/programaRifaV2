"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBoletaListFilters = parseBoletaListFilters;
exports.parseUpdateBoletaPayload = parseUpdateBoletaPayload;
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
function parseOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function parseEstado(value) {
    const stringValue = parseOptionalString(value);
    if (!stringValue) {
        return undefined;
    }
    if (!(stringValue in prisma_client_1.EstadoBoleta)) {
        throw new app_error_1.AppError('El estado de la boleta no es valido.');
    }
    return stringValue;
}
function parseOptionalBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }
    if (normalized === 'true') {
        return true;
    }
    if (normalized === 'false') {
        return false;
    }
    throw new app_error_1.AppError('El filtro "juega" no es valido.', 400);
}
function parseBoletaListFilters(input) {
    return {
        rifaId: parseOptionalString(input.rifaId),
        rifaVendedorId: parseOptionalString(input.rifaVendedorId),
        estado: parseEstado(input.estado),
        numero: parseOptionalString(input.numero),
        vendedorNombre: parseOptionalString(input.vendedorNombre),
        juega: parseOptionalBoolean(input.juega),
    };
}
function parseUpdateBoletaPayload(input) {
    const estado = parseEstado(input.estado);
    if (!estado) {
        throw new app_error_1.AppError('El campo "estado" es obligatorio.');
    }
    const rifaVendedorId = typeof input.rifaVendedorId === 'string' && input.rifaVendedorId.trim().length > 0
        ? input.rifaVendedorId.trim()
        : null;
    return {
        estado,
        rifaVendedorId,
    };
}
