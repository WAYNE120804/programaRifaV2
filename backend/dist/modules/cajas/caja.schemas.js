"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAperturaCajaPayload = parseAperturaCajaPayload;
exports.parseCierreCajaPayload = parseCierreCajaPayload;
exports.parseTrasladoCajaGeneralPayload = parseTrasladoCajaGeneralPayload;
exports.parseSalidaCajaGeneralPayload = parseSalidaCajaGeneralPayload;
const app_error_1 = require("../../lib/app-error");
function parseMoney(value, fieldName) {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un valor valido mayor o igual a cero.`);
    }
    return parsed;
}
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
    const parsed = parseMoney(value, fieldName);
    if (parsed <= 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser mayor a cero.`);
    }
    return parsed;
}
function parseAperturaCajaPayload(input) {
    return {
        saldoInicial: parseMoney(input.saldoInicial, 'saldoInicial'),
        descripcion: parseOptionalString(input.descripcion),
    };
}
function parseCierreCajaPayload(input) {
    return {
        saldoReal: parseMoney(input.saldoReal, 'saldoReal'),
        observaciones: parseOptionalString(input.observaciones),
    };
}
function parseTrasladoCajaGeneralPayload(input) {
    return {
        cajaOrigenId: parseOptionalString(input.cajaOrigenId),
        valor: parsePositiveMoney(input.valor, 'valor'),
        motivo: parseRequiredString(input.motivo, 'motivo'),
        observacion: parseOptionalString(input.observacion),
    };
}
function parseSalidaCajaGeneralPayload(input) {
    return {
        valor: parsePositiveMoney(input.valor, 'valor'),
        motivo: parseRequiredString(input.motivo, 'motivo'),
        observacion: parseOptionalString(input.observacion),
    };
}
