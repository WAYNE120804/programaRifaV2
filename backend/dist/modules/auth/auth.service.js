"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureBootstrapAdmin = ensureBootstrapAdmin;
exports.loginUsuario = loginUsuario;
exports.getAuthProfile = getAuthProfile;
exports.listUsuarios = listUsuarios;
exports.createUsuario = createUsuario;
exports.toggleUsuarioActivo = toggleUsuarioActivo;
const env_1 = require("../../config/env");
const auth_token_1 = require("../../lib/auth-token");
const app_error_1 = require("../../lib/app-error");
const password_1 = require("../../lib/password");
const prisma_client_1 = require("../../lib/prisma-client");
const prisma_1 = require("../../lib/prisma");
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function serializeUser(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
    };
}
async function ensureBootstrapAdmin() {
    const prisma = prismaClient();
    const usersCount = await prisma.usuario.count();
    if (usersCount > 0) {
        return;
    }
    await prisma.usuario.create({
        data: {
            nombre: env_1.env.bootstrapAdminName,
            email: env_1.env.bootstrapAdminEmail.toLowerCase(),
            password: (0, password_1.hashPassword)(env_1.env.bootstrapAdminPassword),
            rol: prisma_client_1.RolUsuario.ADMIN,
            activo: true,
        },
    });
}
async function loginUsuario(payload) {
    const prisma = prismaClient();
    const usuario = await prisma.usuario.findUnique({
        where: { email: payload.email.toLowerCase() },
    });
    if (!usuario || !(0, password_1.verifyPassword)(payload.password, usuario.password)) {
        throw new app_error_1.AppError('Email o contrasena incorrectos.', 401, {
            errorCode: 'INVALID_CREDENTIALS',
        });
    }
    if (!usuario.activo) {
        throw new app_error_1.AppError('Tu usuario esta inactivo.', 403, {
            errorCode: 'USER_DISABLED',
        });
    }
    return {
        token: (0, auth_token_1.createAuthToken)({
            sub: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
        }),
        usuario: serializeUser(usuario),
    };
}
async function getAuthProfile(userId) {
    const usuario = await prismaClient().usuario.findUnique({
        where: { id: userId },
    });
    if (!usuario) {
        throw new app_error_1.AppError('Usuario no encontrado.', 404);
    }
    return serializeUser(usuario);
}
async function listUsuarios() {
    const usuarios = await prismaClient().usuario.findMany({
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
    return usuarios.map(serializeUser);
}
async function createUsuario(payload) {
    const prisma = prismaClient();
    const existing = await prisma.usuario.findUnique({
        where: { email: payload.email.toLowerCase() },
        select: { id: true },
    });
    if (existing) {
        throw new app_error_1.AppError('Ya existe un usuario con ese email.', 409, {
            errorCode: 'EMAIL_IN_USE',
        });
    }
    const usuario = await prisma.usuario.create({
        data: {
            nombre: payload.nombre,
            email: payload.email.toLowerCase(),
            password: (0, password_1.hashPassword)(payload.password),
            rol: payload.rol,
            activo: true,
        },
    });
    return serializeUser(usuario);
}
async function toggleUsuarioActivo(id, activo) {
    const prisma = prismaClient();
    const usuario = await prisma.usuario.findUnique({
        where: { id },
    });
    if (!usuario) {
        throw new app_error_1.AppError('Usuario no encontrado.', 404);
    }
    const totalAdminsActivos = await prisma.usuario.count({
        where: {
            rol: prisma_client_1.RolUsuario.ADMIN,
            activo: true,
        },
    });
    if (usuario.rol === prisma_client_1.RolUsuario.ADMIN && usuario.activo && !activo && totalAdminsActivos <= 1) {
        throw new app_error_1.AppError('No puedes desactivar el ultimo administrador activo.', 409, {
            errorCode: 'LAST_ADMIN',
        });
    }
    const updated = await prisma.usuario.update({
        where: { id },
        data: { activo },
    });
    return serializeUser(updated);
}
