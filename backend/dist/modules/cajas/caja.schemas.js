"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateSubCajaPayload = parseCreateSubCajaPayload;
exports.parsePrepareWebChannelPayload = parsePrepareWebChannelPayload;
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseCreateSubCajaPayload(input) {
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
        nombre: parseRequiredString(input.nombre, 'nombre'),
    };
}
function parsePrepareWebChannelPayload(input) {
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    };
}
