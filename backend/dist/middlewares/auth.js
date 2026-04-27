"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = authenticateRequest;
exports.requireRole = requireRole;
const app_error_1 = require("../lib/app-error");
const auth_token_1 = require("../lib/auth-token");
const prisma_1 = require("../lib/prisma");
function getBearerToken(authorizationHeader) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
        return '';
    }
    return authorizationHeader.slice('Bearer '.length).trim();
}
async function authenticateRequest(req, _res, next) {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            throw new app_error_1.AppError('Debes iniciar sesion para acceder a esta ruta.', 401, {
                errorCode: 'AUTH_REQUIRED',
            });
        }
        const payload = (0, auth_token_1.verifyAuthToken)(token);
        if (!payload) {
            throw new app_error_1.AppError('La sesion no es valida o ya expiro.', 401, {
                errorCode: 'INVALID_SESSION',
            });
        }
        const prisma = (0, prisma_1.getPrisma)();
        if (!prisma) {
            throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
        }
        const usuario = await prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
            },
        });
        if (!usuario || !usuario.activo) {
            throw new app_error_1.AppError('Tu usuario ya no tiene acceso al sistema.', 401, {
                errorCode: 'USER_DISABLED',
            });
        }
        req.authUser = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.authUser) {
            return next(new app_error_1.AppError('Debes iniciar sesion para acceder a esta ruta.', 401, {
                errorCode: 'AUTH_REQUIRED',
            }));
        }
        if (roles.length > 0 && !roles.includes(req.authUser.rol)) {
            return next(new app_error_1.AppError('No tienes permisos para realizar esta accion.', 403, {
                errorCode: 'FORBIDDEN',
            }));
        }
        return next();
    };
}
