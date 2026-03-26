const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const Rifa = connection.define('Rifa', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    consecutivo_actual: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    precio_boleta: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
}, {
    tableName: 'Rifa',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Rifa;
