const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const RifaVendedor = connection.define('RifaVendedor', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    rifa_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vendedor_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    comision_pct: {
        type: DataTypes.DOUBLE,
        defaultValue: 0
    },
    precio_casa: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    boletas_asignadas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    saldo_actual: {
        type: DataTypes.DOUBLE,
        defaultValue: 0
    }
}, {
    tableName: 'RifaVendedor',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = RifaVendedor;
