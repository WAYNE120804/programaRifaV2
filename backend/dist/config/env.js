"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: node_path_1.default.resolve(process.cwd(), '.env') });
exports.env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3002),
    databaseUrl: process.env.DATABASE_URL || '',
    authSecret: process.env.AUTH_SECRET || 'almacen-dev-secret-change-me',
    authTtlSeconds: Number(process.env.AUTH_TTL_SECONDS || 60 * 60 * 12),
    bootstrapAdminName: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador Principal',
    bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@almacen.local',
    bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin123*',
};
