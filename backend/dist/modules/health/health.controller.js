"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
const env_1 = require("../../config/env");
const prisma_1 = require("../../lib/prisma");
async function getHealth(_req, res, next) {
    try {
        const now = new Date().toISOString();
        const checks = {
            api: 'ok',
            database: env_1.env.databaseUrl ? 'configured' : 'missing-database-url',
        };
        if (env_1.env.databaseUrl) {
            const prisma = (0, prisma_1.getPrisma)();
            if (prisma) {
                await prisma.$queryRaw `SELECT 1`;
                checks.database = 'ok';
            }
        }
        res.json({
            status: 'ok',
            timestamp: now,
            phase: 'fase-0',
            checks,
        });
    }
    catch (error) {
        next(error);
    }
}
