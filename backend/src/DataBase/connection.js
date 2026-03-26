//const { database } = require('pg/lib/defaults');
const { Sequelize } = require('sequelize');

var database = 'rifa';
var userName = 'postgres';
var password = 'postgres';

const connection = new Sequelize(database, userName, password, {
    host: 'localhost',
    port: 5434,
    dialect: 'postgres'
});

module.exports = connection;