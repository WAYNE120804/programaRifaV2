"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRifaVendedorPayload = parseRifaVendedorPayload;
exports.parseRifaVendedorUpdatePayload = parseRifaVendedorUpdatePayload;
exports.parseCreateAsignacionPayload = parseCreateAsignacionPayload;
exports.parseCreateDevolucionPayload = parseCreateDevolucionPayload;
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseNumberField(value, fieldName) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un numero valido.`);
    }
    return numberValue;
}
function parseRifaVendedorPayload(input) {
    const rifaId = parseRequiredString(input.rifaId, 'rifaId');
    const vendedorId = parseRequiredString(input.vendedorId, 'vendedorId');
    const comisionPct = parseNumberField(input.comisionPct, 'comisionPct');
    if (comisionPct > 100) {
        throw new app_error_1.AppError('El campo "comisionPct" no puede ser mayor a 100.');
    }
    return {
        rifaId,
        vendedorId,
        comisionPct,
    };
}
function parseRifaVendedorUpdatePayload(input) {
    const comisionPct = parseNumberField(input.comisionPct, 'comisionPct');
    if (comisionPct > 100) {
        throw new app_error_1.AppError('El campo "comisionPct" no puede ser mayor a 100.');
    }
    return {
        comisionPct,
    };
}
function parseCreateAsignacionPayload(input) {
    if (typeof input.metodo !== 'string') {
        throw new app_error_1.AppError('El campo "metodo" es obligatorio.');
    }
    const metodo = input.metodo.trim().toUpperCase();
    if (!['ALEATORIA', 'RANGO', 'LISTA'].includes(metodo)) {
        throw new app_error_1.AppError('El metodo de asignacion no es valido.');
    }
    if (metodo === 'ALEATORIA') {
        const cantidad = Number(input.cantidad);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            throw new app_error_1.AppError('Para asignacion aleatoria debes enviar una cantidad entera mayor que 0.');
        }
        return {
            metodo,
            cantidad,
            permitirParcial: Boolean(input.permitirParcial),
        };
    }
    if (metodo === 'RANGO') {
        const numeroDesde = parseRequiredString(input.numeroDesde, 'numeroDesde');
        const numeroHasta = parseRequiredString(input.numeroHasta, 'numeroHasta');
        return {
            metodo,
            numeroDesde,
            numeroHasta,
            permitirParcial: Boolean(input.permitirParcial),
        };
    }
    const listaNumeros = parseRequiredString(input.listaNumeros, 'listaNumeros');
    return {
        metodo,
        listaNumeros,
        permitirParcial: Boolean(input.permitirParcial),
    };
}
function parseCreateDevolucionPayload(input) {
    if (typeof input.metodo !== 'string') {
        throw new app_error_1.AppError('El campo "metodo" es obligatorio.');
    }
    const metodo = input.metodo.trim().toUpperCase();
    if (!['TODAS', 'LISTA'].includes(metodo)) {
        throw new app_error_1.AppError('El metodo de devolucion no es valido.');
    }
    if (metodo === 'TODAS') {
        return {
            metodo,
            permitirParcial: Boolean(input.permitirParcial),
            destino: typeof input.destino === 'string' && input.destino.trim() === 'FUERA_CIRCULACION'
                ? 'FUERA_CIRCULACION'
                : 'DISPONIBLE',
        };
    }
    return {
        metodo,
        listaNumeros: parseRequiredString(input.listaNumeros, 'listaNumeros'),
        permitirParcial: Boolean(input.permitirParcial),
        destino: typeof input.destino === 'string' && input.destino.trim() === 'FUERA_CIRCULACION'
            ? 'FUERA_CIRCULACION'
            : 'DISPONIBLE',
    };
}
