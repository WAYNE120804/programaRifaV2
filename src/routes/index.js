const express = require('express');

const rifaController = require('../Controllers/rifaController');
const vendedorController = require('../Controllers/vendedorController');
const rifaVendedorController = require('../Controllers/rifaVendedorController');
const abonoController = require('../Controllers/abonoController');
const cajaController = require('../Controllers/cajaController');
const gastoController = require('../Controllers/gastoController');
const reciboController = require('../Controllers/reciboController');

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Rifas
router.post('/rifas', rifaController.create);
router.get('/rifas', rifaController.getAll);
router.get('/rifas/:id', rifaController.getById);
router.put('/rifas/:id', rifaController.update);
router.delete('/rifas/:id', rifaController.remove);

// Vendedores
router.post('/vendedores', vendedorController.create);
router.get('/vendedores', vendedorController.getAll);
router.get('/vendedores/:id', vendedorController.getById);
router.put('/vendedores/:id', vendedorController.update);
router.delete('/vendedores/:id', vendedorController.remove);

// Rifa-Vendedor
router.get('/rifa-vendedores', rifaVendedorController.getAll);
router.get('/rifa-vendedores/:id', rifaVendedorController.getById);
router.post('/rifa-vendedores/vincular', rifaVendedorController.vincularVendedor);
router.post('/rifa-vendedores/:id/asignar-boletas', rifaVendedorController.asignarBoletas);
router.post('/rifa-vendedores/:id/quitar-boletas', rifaVendedorController.quitarBoletas);

// Abonos
router.post('/rifa-vendedores/:id/abonos', abonoController.registrarAbono);
router.get('/rifa-vendedores/:rifaVendedorId/abonos', abonoController.getAllByVendedor);

// Caja
router.post('/cajas', cajaController.create);
router.get('/cajas', cajaController.getAll);
router.get('/cajas/:id', cajaController.getById);
router.put('/cajas/:id', cajaController.update);

// Gastos
router.post('/gastos', gastoController.registrarGasto);
router.get('/gastos', gastoController.getAll);

// Recibos
router.get('/recibos/:id', reciboController.getById);
router.get('/recibos/codigo/:codigo', reciboController.getByCodigo);

module.exports = router;
