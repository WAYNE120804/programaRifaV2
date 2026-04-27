"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClientePayload = parseClientePayload;
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
    const normalized = value.trim();
    return normalized ? normalized : null;
}
function parseDocument(value, fieldName) {
    const normalized = parseRequiredString(value, fieldName).replace(/\s+/g, '');
    if (!/^[0-9A-Za-z.-]+$/.test(normalized)) {
        throw new app_error_1.AppError(`El campo "${fieldName}" contiene caracteres no permitidos.`);
    }
    return normalized;
}
function parsePhone(value, fieldName) {
    const normalized = parseRequiredString(value, fieldName).replace(/[^\d+]/g, '');
    if (normalized.length < 7) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe tener al menos 7 digitos.`);
    }
    return normalized;
}
function parseEmail(value) {
    const normalized = parseOptionalString(value);
    if (!normalized) {
        return null;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
        throw new app_error_1.AppError('El correo electronico no es valido.');
    }
    return normalized.toLowerCase();
}
function parseBirthDate(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }
    const normalized = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        throw new app_error_1.AppError('La fecha de nacimiento debe tener formato YYYY-MM-DD.');
    }
    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        throw new app_error_1.AppError('La fecha de nacimiento no es valida.');
    }
    return date;
}
function parseClientePayload(input) {
    return {
        nombreCompleto: parseRequiredString(input.nombreCompleto, 'nombreCompleto'),
        cedula: parseDocument(input.cedula, 'cedula'),
        telefonoCelular: parsePhone(input.telefonoCelular, 'telefonoCelular'),
        email: parseEmail(input.email),
        fechaNacimiento: parseBirthDate(input.fechaNacimiento),
        observaciones: parseOptionalString(input.observaciones),
    };
}
