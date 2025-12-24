const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const MovimientoCaja = connection.define('MovimientoCaja', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    caja_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo: {
        type: DataTypes.TEXT, // INGRESO or EGRESO
        allowNull: false
    },
    valor: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    abono_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gasto_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'MovimientoCaja',
    timestamps: false
});

module.exports = MovimientoCaja;
