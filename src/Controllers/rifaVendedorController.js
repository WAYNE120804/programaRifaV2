const { RifaVendedor, AsignacionBoletas, Rifa, Vendedor } = require('../Models');
const connection = require('../DataBase/connection');
const { randomUUID } = require('crypto');

const getAll = async (req, res) => {
    try {
        const data = await RifaVendedor.findAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await RifaVendedor.findByPk(id);
        if (!data) return res.status(404).json({ error: 'RifaVendedor no encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 1) Vincular Vendedor a Rifa
const vincularVendedor = async (req, res) => {
    const t = await connection.transaction();
    try {
        const { rifa_id, vendedor_id, comision_pct, precio_casa } = req.body;

        // Validar existencia
        const rifa = await Rifa.findByPk(rifa_id, { transaction: t });
        if (!rifa) throw new Error('Rifa no encontrada');
        if (!rifa.activo) throw new Error('La rifa no está activa');

        const vendedor = await Vendedor.findByPk(vendedor_id, { transaction: t });
        if (!vendedor) throw new Error('Vendedor no encontrado');

        const existe = await RifaVendedor.findOne({ where: { rifa_id, vendedor_id }, transaction: t });
        if (existe) throw new Error('El vendedor ya está vinculado a esta rifa');

        const nuevoVinculo = await RifaVendedor.create({
            id: randomUUID(),
            rifa_id,
            vendedor_id,
            comision_pct,
            precio_casa,
            boletas_asignadas: 0,
            saldo_actual: 0
        }, { transaction: t });

        await t.commit();
        res.status(201).json(nuevoVinculo);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

// 2) Asignar Boletas
const asignarBoletas = async (req, res) => {
    const t = await connection.transaction();
    try {
        const { id } = req.params; // id de RifaVendedor
        const { cantidad, motivo, fecha } = req.body;

        if (cantidad <= 0) throw new Error('La cantidad debe ser positiva');

        const rifaVendedor = await RifaVendedor.findByPk(id, { transaction: t });
        if (!rifaVendedor) throw new Error('Vinculación Rifa-Vendedor no encontrada');

        const rifa = await Rifa.findByPk(rifaVendedor.rifa_id, { transaction: t });
        if (!rifa.activo) throw new Error('No se pueden asignar boletas en una rifa inactiva');

        // Crear registro de asignación
        await AsignacionBoletas.create({
            id: randomUUID(),
            rifa_vendedor_id: id,
            cantidad: cantidad,
            motivo: motivo || 'Asignación de boletas',
            fecha: fecha || new Date()
        }, { transaction: t });

        // Actualizar RifaVendedor
        const costoTotal = cantidad * rifaVendedor.precio_casa;

        rifaVendedor.boletas_asignadas += parseInt(cantidad);
        rifaVendedor.saldo_actual += costoTotal;

        await rifaVendedor.save({ transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Boletas asignadas correctamente', nuevo_saldo: rifaVendedor.saldo_actual, boletas_totales: rifaVendedor.boletas_asignadas });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

// 3) Quitar Boletas
const quitarBoletas = async (req, res) => {
    const t = await connection.transaction();
    try {
        const { id } = req.params; // id de RifaVendedor
        const { cantidad, motivo, fecha } = req.body;

        if (cantidad <= 0) throw new Error('La cantidad debe ser positiva');

        const rifaVendedor = await RifaVendedor.findByPk(id, { transaction: t });
        if (!rifaVendedor) throw new Error('Vinculación Rifa-Vendedor no encontrada');

        const rifa = await Rifa.findByPk(rifaVendedor.rifa_id, { transaction: t });
        if (!rifa.activo) throw new Error('No se pueden quitar boletas en una rifa inactiva');

        if (rifaVendedor.boletas_asignadas < cantidad) {
            throw new Error('No se pueden quitar más boletas de las asignadas');
        }

        // Crear registro de asignación (negativo para historial o lógica explicita, usaré cantidad negativa en AsignacionBoletas para consistencia contable si se desea sumar todo, o un flag. El usuario dijo "crea AsignacionBoletas con cantidad negativa")
        await AsignacionBoletas.create({
            id: randomUUID(),
            rifa_vendedor_id: id,
            cantidad: -cantidad,
            motivo: motivo || 'Devolución de boletas',
            fecha: fecha || new Date()
        }, { transaction: t });

        // Actualizar RifaVendedor
        const reintegroTotal = cantidad * rifaVendedor.precio_casa;

        rifaVendedor.boletas_asignadas -= parseInt(cantidad);
        rifaVendedor.saldo_actual -= reintegroTotal;

        // Validar saldo negativo si se requiere (el usuario dijo "O bloquear, O permitir". "EN MODO SIMPLE se recomienda bloquear o forzar devolución". Yo bloquearé si baja de 0 para seguridad por ahora, o lo dejaré reducir deuda)
        // Por lógica de deuda, si deveolve boletas, reduce deuda. Si saldo < 0 significa que pagó boletas que ahora devuelve -> la casa le debe plata.
        // El usuario dijo "saldo en negativo (a favor del vendedor)". Lo permitiré, pero pondré un warning log si fuera real.

        await rifaVendedor.save({ transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Boletas quitadas correctamente', nuevo_saldo: rifaVendedor.saldo_actual, boletas_totales: rifaVendedor.boletas_asignadas });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    vincularVendedor,
    asignarBoletas,
    quitarBoletas
};
