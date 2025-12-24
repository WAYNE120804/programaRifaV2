const Rifa = require('./Rifa');
const Vendedor = require('./Vendedor');
const RifaVendedor = require('./RifaVendedor');
const AsignacionBoletas = require('./AsignacionBoletas');
const Abono = require('./Abono');
const Gasto = require('./Gasto');
const Caja = require('./Caja');
const MovimientoCaja = require('./MovimientoCaja');
const Recibo = require('./Recibo');

// Associations

// Rifa - RifaVendedor - Vendedor
Rifa.hasMany(RifaVendedor, { foreignKey: 'rifa_id' });
RifaVendedor.belongsTo(Rifa, { foreignKey: 'rifa_id' });

Vendedor.hasMany(RifaVendedor, { foreignKey: 'vendedor_id' });
RifaVendedor.belongsTo(Vendedor, { foreignKey: 'vendedor_id' });

// RifaVendedor - AsignacionBoletas
RifaVendedor.hasMany(AsignacionBoletas, { foreignKey: 'rifa_vendedor_id' });
AsignacionBoletas.belongsTo(RifaVendedor, { foreignKey: 'rifa_vendedor_id' });

// RifaVendedor - Abono
RifaVendedor.hasMany(Abono, { foreignKey: 'rifa_vendedor_id' });
Abono.belongsTo(RifaVendedor, { foreignKey: 'rifa_vendedor_id' });

// Rifa - Gasto
Rifa.hasMany(Gasto, { foreignKey: 'rifa_id' });
Gasto.belongsTo(Rifa, { foreignKey: 'rifa_id' });

// RifaVendedor - Gasto (Optional link for refund tracing)
RifaVendedor.hasMany(Gasto, { foreignKey: 'rifa_vendedor_id' });
Gasto.belongsTo(RifaVendedor, { foreignKey: 'rifa_vendedor_id' });

// Caja - MovimientoCaja
Caja.hasMany(MovimientoCaja, { foreignKey: 'caja_id' });
MovimientoCaja.belongsTo(Caja, { foreignKey: 'caja_id' });

// MovimientoCaja - Abono
Abono.hasOne(MovimientoCaja, { foreignKey: 'abono_id' });
MovimientoCaja.belongsTo(Abono, { foreignKey: 'abono_id' });

// MovimientoCaja - Gasto
Gasto.hasOne(MovimientoCaja, { foreignKey: 'gasto_id' });
MovimientoCaja.belongsTo(Gasto, { foreignKey: 'gasto_id' });

// Abono - Recibo
Abono.hasOne(Recibo, { foreignKey: 'abono_id' });
Recibo.belongsTo(Abono, { foreignKey: 'abono_id' });

module.exports = {
    Rifa,
    Vendedor,
    RifaVendedor,
    AsignacionBoletas,
    Abono,
    Gasto,
    Caja,
    MovimientoCaja,
    Recibo
};
