const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const Abono = connection.define('Abono', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    rifa_vendedor_id: {
        type: DataTypes.STRING,
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
    medio_pago: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Abono',
    timestamps: false
});

module.exports = Abono;
