"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.juegoRouter = void 0;
const express_1 = require("express");
const juego_controller_1 = require("./juego.controller");
exports.juegoRouter = (0, express_1.Router)();
exports.juegoRouter.get('/', juego_controller_1.getJuego);
exports.juegoRouter.put('/rifa-vendedores/:id', juego_controller_1.putJuegoRifaVendedor);
