"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConfiguracionPayload = parseConfiguracionPayload;
const app_error_1 = require("../../lib/app-error");
const defaultThemeColors = {
    sidebarBg: '#ffffff',
    sidebarButtonBg: '#ffffff',
    sidebarButtonText: '#334155',
    sidebarActiveBg: '#e2e8f0',
    sidebarActiveText: '#0f172a',
    topbarBg: '#ffffff',
    topbarText: '#0f172a',
    sectionTitleText: '#0f172a',
    sectionSubtitleText: '#64748b',
    summaryLabelText: '#94a3b8',
    summaryValueText: '#0f172a',
    tableHeaderBg: '#f1f5f9',
    tableHeaderText: '#475569',
};
function parseRequiredName(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError('El campo "nombreCasaRifera" es obligatorio.');
    }
    return value.trim();
}
function parseLogoDataUrl(value) {
    if (value === null || typeof value === 'undefined' || value === '') {
        return null;
    }
    if (typeof value !== 'string') {
        throw new app_error_1.AppError('El campo "logoDataUrl" debe ser una cadena valida o null.');
    }
    const normalizedValue = value.trim();
    if (!normalizedValue.startsWith('data:image/')) {
        throw new app_error_1.AppError('El logo debe enviarse como imagen en formato base64.');
    }
    return normalizedValue;
}
function parseOptionalDataUrl(value, fieldName) {
    if (value === null || typeof value === 'undefined' || value === '') {
        return null;
    }
    if (typeof value !== 'string') {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una cadena valida o null.`);
    }
    const normalizedValue = value.trim();
    if (!normalizedValue.startsWith('data:')) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe enviarse como archivo en formato base64.`);
    }
    return normalizedValue;
}
function parseOptionalText(value, fieldName) {
    if (value === null || typeof value === 'undefined' || value === '') {
        return null;
    }
    if (typeof value !== 'string') {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una cadena valida o null.`);
    }
    const normalizedValue = value.trim();
    return normalizedValue.length ? normalizedValue : null;
}
function isHexColor(value) {
    return /^#([0-9a-fA-F]{6})$/.test(value);
}
function parseThemeColors(value) {
    if (value === null || typeof value === 'undefined') {
        return defaultThemeColors;
    }
    if (typeof value !== 'object') {
        throw new app_error_1.AppError('El campo "themeColors" debe ser un objeto valido.');
    }
    const source = value;
    const result = { ...defaultThemeColors };
    for (const key of Object.keys(defaultThemeColors)) {
        const raw = source[key];
        if (typeof raw === 'undefined' || raw === null || raw === '') {
            continue;
        }
        if (typeof raw !== 'string' || !isHexColor(raw.trim())) {
            throw new app_error_1.AppError(`El color "${key}" debe estar en formato hexadecimal #RRGGBB.`);
        }
        result[key] = raw.trim();
    }
    return result;
}
function parseConfiguracionPayload(input) {
    return {
        nombreCasaRifera: parseRequiredName(input.nombreCasaRifera),
        logoDataUrl: parseLogoDataUrl(input.logoDataUrl),
        reglamentoDataUrl: parseOptionalDataUrl(input.reglamentoDataUrl, 'reglamentoDataUrl'),
        reglamentoNombreArchivo: parseOptionalText(input.reglamentoNombreArchivo, 'reglamentoNombreArchivo'),
        responsableNombre: parseOptionalText(input.responsableNombre, 'responsableNombre'),
        responsableTelefono: parseOptionalText(input.responsableTelefono, 'responsableTelefono'),
        responsableDireccion: parseOptionalText(input.responsableDireccion, 'responsableDireccion'),
        responsableCiudad: parseOptionalText(input.responsableCiudad, 'responsableCiudad'),
        responsableDepartamento: parseOptionalText(input.responsableDepartamento, 'responsableDepartamento'),
        numeroResolucionAutorizacion: parseOptionalText(input.numeroResolucionAutorizacion, 'numeroResolucionAutorizacion'),
        entidadAutoriza: parseOptionalText(input.entidadAutoriza, 'entidadAutoriza'),
        themeColors: parseThemeColors(input.themeColors),
    };
}
