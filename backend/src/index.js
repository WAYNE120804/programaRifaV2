const express = require('express');
const cors = require('cors');

const connection = require('./DataBase/connection');
const routes = require('./routes');

const app = express();
app.use(cors());

app.use(express.json());
app.use('/api', routes);

const port = process.env.PORT || 3002;

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

// Global Error Handlers
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

startServer();
