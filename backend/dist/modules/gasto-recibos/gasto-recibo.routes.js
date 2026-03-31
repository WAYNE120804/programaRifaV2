"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gastoReciboRouter = void 0;
const express_1 = require("express");
const gasto_recibo_controller_1 = require("./gasto-recibo.controller");
exports.gastoReciboRouter = (0, express_1.Router)();
exports.gastoReciboRouter.get('/codigo/:codigo', gasto_recibo_controller_1.getGastoReciboPublico);
exports.gastoReciboRouter.get('/:id', gasto_recibo_controller_1.getGastoRecibo);
