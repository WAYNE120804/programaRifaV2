//const { database } = require('pg/lib/defaults');
const { Sequelize } = require('sequelize');

var database = 'rifa';
var userName = 'postgres';
var password = 'postgres';

const connection = new Sequelize(database, userName, password, {
    host: 'localhost',
    dialect: 'postgres'
});

module.exports = connection;