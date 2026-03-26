const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const AsignacionBoletas = connection.define('AsignacionBoletas', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    rifa_vendedor_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    motivo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha: {
        type: DataTypes.DATE, // Using DATE which maps to TIMESTAMP WITH TIME ZONE by default in Sequelize/Postgres, or TIMESTAMP without TZ if configured. Based on diagram it is TIMESTAMP(3) WITHOUT TIME ZONE. Sequelize 'DATE' usually handles JS Date objects fine.
        allowNull: false
    }
}, {
    tableName: 'AsignacionBoletas',
    timestamps: false // Diagram shows only 'fecha', no created_at/updated_at explicitly? Diagram shows 'fecha' field. RifaVendedor has timestamps. AsignacionBoletas diagram does NOT show created_at/updated_at.
});

module.exports = AsignacionBoletas;
