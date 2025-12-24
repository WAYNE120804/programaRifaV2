const express = require('express');

const connection = require('./DataBase/connection');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use('/api', routes);

const port = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connection.authenticate();

        if (process.env.SYNC_DB === 'true') {
            await connection.sync();
        }

        app.listen(port, () => {
            console.log(`Servidor iniciado en http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();
