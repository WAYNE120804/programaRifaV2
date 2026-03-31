"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePremioPayload = parsePremioPayload;
exports.parsePremioBoletasPayload = parsePremioBoletasPayload;
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseOptionalString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}
function parseNumberField(value, fieldName) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un numero valido.`);
    }
    return numberValue;
}
function parseDateField(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
    }
    return parsed;
}
function parseTipoPremio(value) {
    if (typeof value !== 'string') {
        throw new app_error_1.AppError('El campo "tipo" es obligatorio.');
    }
    const normalized = value.trim().toUpperCase();
    if (!['MAYOR', 'ANTICIPADO'].includes(normalized)) {
        throw new app_error_1.AppError('El tipo de premio no es valido.');
    }
    return normalized;
}
function parsePremioPayload(input) {
    const mostrarValor = Boolean(input.mostrarValor);
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
        nombre: parseRequiredString(input.nombre, 'nombre'),
        descripcion: parseOptionalString(input.descripcion),
        tipo: parseTipoPremio(input.tipo),
        mostrarValor,
        valor: mostrarValor ? parseNumberField(input.valor, 'valor') : null,
        fecha: parseDateField(input.fecha, 'fecha'),
    };
}
function parsePremioBoletasPayload(input) {
    if (!Array.isArray(input.numeros)) {
        throw new app_error_1.AppError('Debes enviar una lista de numeros para el premio.');
    }
    const numeros = input.numeros
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    return {
        numeros: [...new Set(numeros)],
    };
}
