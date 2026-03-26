const connection = require('./src/DataBase/connection');
const Models = require('./src/Models');

async function testSync() {
    try {
        await connection.authenticate();
        console.log('Auth OK');
        await connection.sync({ alter: true }); // Try to sync
        console.log('Sync OK');
    } catch (error) {
        console.error('Sync Error:', error);
    }
}

testSync();
