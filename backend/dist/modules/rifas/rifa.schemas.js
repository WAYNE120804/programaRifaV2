"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRifaPayload = parseRifaPayload;
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseDate(value, fieldName) {
    const stringValue = parseRequiredString(value, fieldName);
    const date = new Date(stringValue);
    if (Number.isNaN(date.getTime())) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
    }
    return date;
}
function parsePrice(value) {
    const price = Number(value);
    if (!Number.isFinite(price) || price <= 0) {
        throw new app_error_1.AppError('El campo "precioBoleta" debe ser un numero mayor que 0.');
    }
    return price;
}
function parseNumeroCifras(value) {
    const numeroCifras = Number(value);
    if (![2, 3, 4].includes(numeroCifras)) {
        throw new app_error_1.AppError('El campo "numeroCifras" debe ser 2, 3 o 4.');
    }
    return numeroCifras;
}
function parseEstado(value) {
    if (value === undefined || value === null || value === '') {
        return prisma_client_1.EstadoRifa.BORRADOR;
    }
    if (typeof value !== 'string' || !(value in prisma_client_1.EstadoRifa)) {
        throw new app_error_1.AppError('El campo "estado" no es valido.');
    }
    return value;
}
function parseRifaPayload(input) {
    const nombre = parseRequiredString(input.nombre, 'nombre');
    const loteriaNombre = parseRequiredString(input.loteriaNombre, 'loteriaNombre');
    const numeroCifras = parseNumeroCifras(input.numeroCifras);
    const fechaInicio = parseDate(input.fechaInicio, 'fechaInicio');
    const fechaFin = parseDate(input.fechaFin, 'fechaFin');
    const precioBoleta = parsePrice(input.precioBoleta);
    const estado = parseEstado(input.estado);
    if (fechaFin < fechaInicio) {
        throw new app_error_1.AppError('La fecha de fin no puede ser menor que la fecha de inicio.');
    }
    return {
        nombre,
        loteriaNombre,
        numeroCifras,
        fechaInicio,
        fechaFin,
        precioBoleta,
        estado,
    };
}
