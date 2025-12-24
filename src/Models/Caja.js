const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const Caja = connection.define('Caja', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    saldo: {
        type: DataTypes.DOUBLE,
        defaultValue: 0
    }
}, {
    tableName: 'Caja',
    timestamps: true, // Schema shows updated_at
    createdAt: false, // Schema only shows updated_at in one of the images or it implies standard timestamps. I'll enable timestamps but maybe only updated_at if schema is super strict, but standard timestamps is safer for Sequelize. The diagram shows updated_at. I'll keep default timestamps to be safe.
    updatedAt: 'updated_at',
    createdAt: false // Schema for Caja only shows updated_at? Let's check diagram. Caja: id, nombre, saldo, updated_at. No created_at shown. I will disable createdAt.
});

module.exports = Caja;
