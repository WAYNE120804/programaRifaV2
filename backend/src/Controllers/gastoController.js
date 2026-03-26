const { Gasto, Caja, MovimientoCaja, RifaVendedor } = require('../Models');
const connection = require('../DataBase/connection');
const { randomUUID } = require('crypto');

const registrarGasto = async (req, res) => {
    const t = await connection.transaction();
    try {
        const { rifa_id, valor, descripcion, fecha, tipo, caja_id, rifa_vendedor_id } = req.body;

        if (valor <= 0) throw new Error('El valor del gasto debe ser positivo');
        if (!caja_id) throw new Error('Se requiere especificar la Caja');

        // Validar tipo (GASTO o DEVOLUCION según DB constraint)
        const tipoUpper = tipo ? tipo.toUpperCase() : 'GASTO';
        if (!['GASTO', 'DEVOLUCION'].includes(tipoUpper)) {
            throw new Error('Tipo de gasto inválido. Use GASTO o DEVOLUCION');
        }

        const caja = await Caja.findByPk(caja_id, { transaction: t });
        if (!caja) throw new Error('Caja no encontrada');

        // Validar saldo caja
        if (caja.saldo < valor) {
            throw new Error('Saldo insuficiente en caja para registrar este gasto');
        }

        // Crear Gasto
        const gastoId = randomUUID();
        const gasto = await Gasto.create({
            id: gastoId,
            rifa_id,
            valor,
            descripcion,
            fecha: fecha || new Date(),
            tipo: tipoUpper,
            rifa_vendedor_id // Optional
        }, { transaction: t });

        // Actualizar Caja
        caja.saldo -= parseFloat(valor);
        await caja.save({ transaction: t });

        // Lógica de Devolución a Vendedor
        if (tipoUpper === 'DEVOLUCION' && rifa_vendedor_id) {
            const rv = await RifaVendedor.findByPk(rifa_vendedor_id, { transaction: t });
            if (rv) {
                // Al devolverle dinero al vendedor, su deuda (saldo_actual) aumenta
                rv.saldo_actual += parseFloat(valor);
                await rv.save({ transaction: t });
            }
        }

        // Crear MovimientoCaja (EGRESO)
        await MovimientoCaja.create({
            id: randomUUID(),
            caja_id,
            tipo: 'EGRESO',
            valor,
            fecha: fecha || new Date(),
            descripcion: descripcion || `Gasto registrado (${tipoUpper})`,
            gasto_id: gastoId
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Gasto registrado correctamente', gasto });

    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await Gasto.findAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registrarGasto,
    getAll
};
