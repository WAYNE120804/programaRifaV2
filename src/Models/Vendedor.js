const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const Vendedor = connection.define('Vendedor', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    telefono: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    documento: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Vendedor',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Vendedor;
