const { Recibo } = require('../Models');

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Recibo.findByPk(id);
        if (!data) return res.status(404).json({ error: 'Recibo no encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getByCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;
        const data = await Recibo.findOne({ where: { codigo_unico: codigo } });
        if (!data) return res.status(404).json({ error: 'Recibo no encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getById,
    getByCodigo
};
