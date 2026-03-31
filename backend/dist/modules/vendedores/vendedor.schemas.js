"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVendedorPayload = parseVendedorPayload;
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseOptionalString(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new app_error_1.AppError('Los campos opcionales deben ser texto.');
    }
    const normalized = value.trim();
    return normalized.length ? normalized : null;
}
function parseVendedorPayload(input) {
    return {
        nombre: parseRequiredString(input.nombre, 'nombre'),
        telefono: parseOptionalString(input.telefono),
        documento: parseOptionalString(input.documento),
        direccion: parseOptionalString(input.direccion),
    };
}
