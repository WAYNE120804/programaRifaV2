const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const Gasto = connection.define('Gasto', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    rifa_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tipo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rifa_vendedor_id: {
        type: DataTypes.STRING, // Optional, can be null
        allowNull: true
    }
}, {
    tableName: 'Gasto',
    timestamps: false
});

module.exports = Gasto;
