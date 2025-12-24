const { Abono, RifaVendedor, Caja, MovimientoCaja, Recibo, Rifa } = require('../Models');
const connection = require('../DataBase/connection');
const { randomUUID } = require('crypto');

const registrarAbono = async (req, res) => {
    const t = await connection.transaction();
    try {
        const { id } = req.params; // id de RifaVendedor
        const { valor, fecha, medio_pago, caja_id } = req.body;

        if (valor <= 0) throw new Error('El valor del abono debe ser positivo');
        if (!caja_id) throw new Error('Se requiere especificar la Caja');

        const rifaVendedor = await RifaVendedor.findByPk(id, { include: [Rifa], transaction: t });
        if (!rifaVendedor) throw new Error('Vinculación Rifa-Vendedor no encontrada');

        const caja = await Caja.findByPk(caja_id, { transaction: t });
        if (!caja) throw new Error('Caja no encontrada');

        // 1. Crear Abono
        const abonoId = randomUUID();
        const abono = await Abono.create({
            id: abonoId,
            rifa_vendedor_id: id,
            valor: valor,
            fecha: fecha || new Date(),
            medio_pago: medio_pago || 'Efectivo'
        }, { transaction: t });

        // 2. Actualizar Saldo Vendedor (Disminuye deuda)
        const saldoAnterior = rifaVendedor.saldo_actual;
        rifaVendedor.saldo_actual -= valor;
        await rifaVendedor.save({ transaction: t });

        // 3. Actualizar Caja
        caja.saldo += parseFloat(valor);
        await caja.save({ transaction: t });

        // 4. Crear Movimiento Caja
        await MovimientoCaja.create({
            id: randomUUID(),
            caja_id: caja_id,
            tipo: 'INGRESO',
            valor: valor,
            fecha: fecha || new Date(),
            descripcion: `Abono rifa ${rifaVendedor.Rifa.nombre} - Vendedor ID ${rifaVendedor.vendedor_id}`,
            abono_id: abonoId
        }, { transaction: t });

        // 5. Generar Consecutivo de Recibo (Bloqueo optimista o usar increment)
        // Incrementamos el consecutivo de la Rifa
        const rifa = rifaVendedor.Rifa;
        const nuevoConsecutivo = rifa.consecutivo_actual + 1;
        rifa.consecutivo_actual = nuevoConsecutivo;
        await rifa.save({ transaction: t });

        // 6. Generar Recibo
        const codigoUnico = `RIFA-${rifa.id.substring(0, 4)}-${nuevoConsecutivo}`; // Ejemplo simple

        const payload = {
            rifa_nombre: rifa.nombre,
            vendedor_id: rifaVendedor.vendedor_id,
            fecha: fecha || new Date(),
            valor_abonado: valor,
            saldo_anterior: saldoAnterior,
            saldo_nuevo: rifaVendedor.saldo_actual,
            medio_pago: medio_pago,
            consecutivo: nuevoConsecutivo,
            codigo: codigoUnico
        };

        const recibo = await Recibo.create({
            id: randomUUID(),
            abono_id: abonoId,
            consecutivo_rifa: nuevoConsecutivo,
            codigo_unico: codigoUnico,
            fecha_impresion: new Date(),
            payload: payload
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            message: 'Abono registrado exitosamente',
            abono,
            recibo: { ...recibo.toJSON(), payload }
        });

    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

const getAllByVendedor = async (req, res) => {
    try {
        const { rifaVendedorId } = req.params;
        const data = await Abono.findAll({ where: { rifa_vendedor_id: rifaVendedorId } });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ... otros get

module.exports = {
    registrarAbono,
    getAllByVendedor
};
