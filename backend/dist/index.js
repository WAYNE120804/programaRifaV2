"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const auth_service_1 = require("./modules/auth/auth.service");
async function start() {
    await (0, auth_service_1.ensureBootstrapAdmin)();
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.port, () => {
        logger_1.logger.info(`Servidor backend escuchando en http://localhost:${env_1.env.port}`);
        logger_1.logger.info(`Usuario admin inicial: ${env_1.env.bootstrapAdminEmail} / ${env_1.env.bootstrapAdminPassword}`);
    });
}
start().catch((error) => {
    logger_1.logger.error('No fue posible iniciar el backend.', error);
    process.exit(1);
});
