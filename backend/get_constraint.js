const connection = require('./src/DataBase/connection');
async function run() {
    try {
        const [results] = await connection.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE conname = 'gasto_tipo_chk'");
        console.log('CONSTRAINT_DEF:', JSON.stringify(results));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
