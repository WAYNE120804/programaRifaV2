const { Vendedor } = require('../Models');
const { randomUUID } = require('crypto');

const create = async (req, res) => {
    try {
        const { nombre, telefono, documento, direccion } = req.body;
        const nuevo = await Vendedor.create({
            id: randomUUID(),
            nombre,
            telefono,
            documento,
            direccion
        });
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await Vendedor.findAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Vendedor.findByPk(id);
        if (!data) return res.status(404).json({ error: 'Vendedor no encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Vendedor.update(req.body, { where: { id } });
        if (updated) {
            const updatedVendedor = await Vendedor.findByPk(id);
            return res.json(updatedVendedor);
        }
        res.status(404).json({ error: 'Vendedor no encontrado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Vendedor.destroy({ where: { id } });
        if (deleted) {
            return res.status(204).send();
        }
        res.status(404).json({ error: 'Vendedor no encontrado' });
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
