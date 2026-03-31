"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boletaRouter = void 0;
const express_1 = require("express");
const boleta_controller_1 = require("./boleta.controller");
exports.boletaRouter = (0, express_1.Router)();
exports.boletaRouter.get('/', boleta_controller_1.getAllBoletas);
exports.boletaRouter.get('/:id', boleta_controller_1.getBoleta);
exports.boletaRouter.put('/:id', boleta_controller_1.putBoleta);
