const sequelize = require('./src/DataBase/connection');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('Connection OK');
        const t = await sequelize.transaction();
        console.log('Transaction OK');
        await t.rollback();
        console.log('Rollback OK');
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
