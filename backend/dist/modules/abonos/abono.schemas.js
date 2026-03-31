"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateAbonoPayload = parseCreateAbonoPayload;
exports.parseAnularAbonoPayload = parseAnularAbonoPayload;
const app_error_1 = require("../../lib/app-error");
function parseRequiredPositiveNumber(value, fieldName) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un numero mayor a 0.`);
    }
    return Number(numericValue.toFixed(2));
}
function parseOptionalDate(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const rawValue = String(value).trim();
    const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const now = new Date();
        const date = new Date(Number(year), Number(month) - 1, Number(day), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        if (Number.isNaN(date.getTime())) {
            throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
        }
        return date;
    }
    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
    }
    return date;
}
function parseOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseMetodoPago(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError('El campo "metodoPago" es obligatorio.');
    }
    const metodoPago = value.trim().toUpperCase();
    if (!['EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TRANSFERENCIA'].includes(metodoPago)) {
        throw new app_error_1.AppError('El metodo de pago no es valido.');
    }
    return metodoPago;
}
function parseCreateAbonoPayload(input) {
    return {
        subCajaId: parseRequiredString(input.subCajaId, 'subCajaId'),
        valor: parseRequiredPositiveNumber(input.valor, 'valor'),
        fecha: parseOptionalDate(input.fecha, 'fecha'),
        descripcion: parseOptionalString(input.descripcion),
        metodoPago: parseMetodoPago(input.metodoPago),
    };
}
function parseAnularAbonoPayload(input) {
    return {
        motivo: parseRequiredString(input.motivo, 'motivo'),
    };
}
