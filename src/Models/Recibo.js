const { DataTypes } = require('sequelize');
const connection = require('../DataBase/connection');

const Recibo = connection.define('Recibo', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    abono_id: {
        type: DataTypes.STRING,
        allowNull: true // Schema shows FK arrow.
    },
    consecutivo_rifa: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    codigo_unico: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha_impresion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    tableName: 'Recibo',
    timestamps: false
});

module.exports = Recibo;
