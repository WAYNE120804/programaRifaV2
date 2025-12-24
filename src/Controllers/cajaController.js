const { Caja, MovimientoCaja } = require('../Models');
const { randomUUID } = require('crypto');

const create = async (req, res) => {
    try {
        const { nombre, saldo } = req.body;
        const nueva = await Caja.create({
            id: randomUUID(),
            nombre,
            saldo: saldo || 0
        });
        res.status(201).json(nueva);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await Caja.findAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Caja.findByPk(id, {
            include: [{ model: MovimientoCaja, limit: 10, order: [['fecha', 'DESC']] }]
        });
        if (!data) return res.status(404).json({ error: 'Caja no encontrada' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// No update/delete for Caja in basic version to protect integrity, only Create/Read.
// Or simple update for name.
const update = async (req, res) => {
    try {
        const { id } = req.params;
        // Sólo permitir cambio de nombre
        const { nombre } = req.body;
        const [updated] = await Caja.update({ nombre }, { where: { id } });
        if (updated) {
            return res.json({ message: 'Caja actualizada' });
        }
        res.status(404).json({ error: 'Caja no encontrada' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update
};
