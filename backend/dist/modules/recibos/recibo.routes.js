"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reciboRouter = void 0;
const express_1 = require("express");
const recibo_controller_1 = require("./recibo.controller");
exports.reciboRouter = (0, express_1.Router)();
exports.reciboRouter.get('/codigo/:codigo', recibo_controller_1.getReciboPublico);
exports.reciboRouter.get('/:id', recibo_controller_1.getRecibo);
