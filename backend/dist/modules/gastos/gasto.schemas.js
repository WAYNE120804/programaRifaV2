"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateGastoPayload = parseCreateGastoPayload;
exports.parseAnularGastoPayload = parseAnularGastoPayload;
const app_error_1 = require("../../lib/app-error");
const prisma_client_1 = require("../../lib/prisma-client");
const categoriaGastoValues = new Set(Object.values(prisma_client_1.CategoriaGasto));
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
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
function parseCategoriaGasto(value) {
    const rawValue = typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : 'OTROS';
    if (!categoriaGastoValues.has(rawValue)) {
        throw new app_error_1.AppError('La categoria del gasto no es valida.');
    }
    return rawValue;
}
function parseCreateGastoPayload(input) {
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
        subCajaId: typeof input.subCajaId === 'string' && input.subCajaId.trim().length > 0
            ? input.subCajaId.trim()
            : undefined,
        categoria: parseCategoriaGasto(input.categoria),
        valor: parseRequiredPositiveNumber(input.valor, 'valor'),
        fecha: parseOptionalDate(input.fecha, 'fecha'),
        descripcion: parseRequiredString(input.descripcion, 'descripcion'),
    };
}
function parseAnularGastoPayload(input) {
    return {
        motivo: parseRequiredString(input.motivo, 'motivo'),
    };
}
