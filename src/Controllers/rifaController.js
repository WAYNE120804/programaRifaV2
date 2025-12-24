const { Rifa } = require('../Models');
const { randomUUID } = require('crypto');

const create = async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin, precio_boleta } = req.body;
        const nuevaRifa = await Rifa.create({
            id: randomUUID(),
            nombre,
            fecha_inicio,
            fecha_fin,
            precio_boleta,
            consecutivo_actual: 0,
            activo: true
        });
        res.status(201).json(nuevaRifa);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await Rifa.findAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Rifa.findByPk(id);
        if (!data) return res.status(404).json({ error: 'Rifa no encontrada' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Rifa.update(req.body, { where: { id } });
        if (updated) {
            const updatedRifa = await Rifa.findByPk(id);
            return res.json(updatedRifa);
        }
        res.status(404).json({ error: 'Rifa no encontrada' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Rifa.destroy({ where: { id } });
        if (deleted) {
            return res.status(204).send();
        }
        res.status(404).json({ error: 'Rifa no encontrada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
