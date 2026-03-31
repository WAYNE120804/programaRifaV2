"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuracionRouter = void 0;
const express_1 = require("express");
const configuracion_controller_1 = require("./configuracion.controller");
exports.configuracionRouter = (0, express_1.Router)();
exports.configuracionRouter.get('/', configuracion_controller_1.getConfiguracion);
exports.configuracionRouter.put('/', configuracion_controller_1.putConfiguracion);
