"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguracionSistema = getConfiguracionSistema;
exports.updateConfiguracionSistema = updateConfiguracionSistema;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const configDir = node_path_1.default.resolve(process.cwd(), 'storage');
const configFile = node_path_1.default.join(configDir, 'configuracion.json');
const defaultConfig = {
    id: 'principal',
    clave: 'principal',
    nombreNegocio: 'Almacen Admin',
    logoDataUrl: null,
    propietarioNombre: null,
    propietarioTelefono: null,
    direccion: null,
    ciudad: null,
    departamento: null,
    notasRecibo: null,
    themeColors: {
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
    },
};
async function ensureConfigFile() {
    await (0, promises_1.mkdir)(configDir, { recursive: true });
    try {
        const raw = await (0, promises_1.readFile)(configFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
            ...defaultConfig,
            ...parsed,
            themeColors: {
                ...defaultConfig.themeColors,
                ...(parsed.themeColors || {}),
            },
        };
    }
    catch (_error) {
        await (0, promises_1.writeFile)(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8');
        return defaultConfig;
    }
}
async function getConfiguracionSistema() {
    return ensureConfigFile();
}
async function updateConfiguracionSistema(payload) {
    const nextConfig = {
        ...(await ensureConfigFile()),
        ...payload,
        themeColors: {
            ...defaultConfig.themeColors,
            ...(payload.themeColors || {}),
        },
    };
    await (0, promises_1.writeFile)(configFile, JSON.stringify(nextConfig, null, 2), 'utf-8');
    return nextConfig;
}
