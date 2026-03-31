"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
const prisma_client_1 = require("./prisma-client");
const env_1 = require("../config/env");
const connectionString = env_1.env.databaseUrl || process.env.DATABASE_URL || undefined;
let prisma = globalThis.prismaGlobal || null;
function getPrisma() {
    if (!connectionString) {
        return null;
    }
    if (!prisma) {
        prisma = new prisma_client_1.PrismaClient({
            log: ['warn', 'error'],
            datasources: {
                db: {
                    url: connectionString,
                },
            },
        });
        if (process.env.NODE_ENV !== 'production') {
            globalThis.prismaGlobal = prisma;
        }
    }
    return prisma;
}
