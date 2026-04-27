"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("./middlewares/auth");
const error_handler_1 = require("./middlewares/error-handler");
const not_found_handler_1 = require("./middlewares/not-found-handler");
const serialize_response_1 = require("./middlewares/serialize-response");
const routes_1 = require("./routes");
const publicApiRules = [
    { method: 'GET', pattern: /^\/api\/health(?:\/.*)?$/ },
    { method: 'POST', pattern: /^\/api\/auth\/login$/ },
];
function isPublicApiRoute(method, path) {
    return publicApiRules.some((rule) => rule.method === method.toUpperCase() && rule.pattern.test(path));
}
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use(serialize_response_1.serializeResponse);
    app.get('/', (_req, res) => {
        res.json({
            name: 'Sistema Administrativo de Almacen API',
            status: 'ok',
            phase: 'base-limpia',
        });
    });
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            return next();
        }
        if (isPublicApiRoute(req.method, req.path)) {
            return next();
        }
        return (0, auth_1.authenticateRequest)(req, res, next);
    });
    app.use('/api', routes_1.apiRouter);
    app.use(not_found_handler_1.notFoundHandler);
    app.use(error_handler_1.errorHandler);
    return app;
}
