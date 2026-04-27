"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postLogin = postLogin;
exports.getMe = getMe;
exports.getUsuarios = getUsuarios;
exports.postUsuario = postUsuario;
exports.patchUsuarioActivo = patchUsuarioActivo;
const auth_service_1 = require("./auth.service");
const auth_schemas_1 = require("./auth.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
function parseBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value === 'true';
    }
    return false;
}
async function postLogin(req, res, next) {
    try {
        res.json(await (0, auth_service_1.loginUsuario)((0, auth_schemas_1.parseLoginPayload)(req.body)));
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        res.json(await (0, auth_service_1.getAuthProfile)(req.authUser.id));
    }
    catch (error) {
        next(error);
    }
}
async function getUsuarios(_req, res, next) {
    try {
        res.json(await (0, auth_service_1.listUsuarios)());
    }
    catch (error) {
        next(error);
    }
}
async function postUsuario(req, res, next) {
    try {
        const usuario = await (0, auth_service_1.createUsuario)((0, auth_schemas_1.parseUsuarioPayload)(req.body));
        res.status(201).json(usuario);
    }
    catch (error) {
        next(error);
    }
}
async function patchUsuarioActivo(req, res, next) {
    try {
        res.json(await (0, auth_service_1.toggleUsuarioActivo)(getIdParam(req.params.id), parseBoolean(req.body?.activo)));
    }
    catch (error) {
        next(error);
    }
}
