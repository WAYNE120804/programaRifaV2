"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPremiosByRifa = listPremiosByRifa;
exports.getPremioById = getPremioById;
exports.createPremio = createPremio;
exports.updatePremio = updatePremio;
exports.deletePremio = deletePremio;
exports.updatePremioBoletas = updatePremioBoletas;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const premioInclude = {
    rifa: {
        select: {
            id: true,
            nombre: true,
            loteriaNombre: true,
            numeroCifras: true,
        },
    },
    boletas: {
        select: {
            boleta: {
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                    rifaVendedor: {
                        select: {
                            vendedor: {
                                select: {
                                    nombre: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            boleta: {
                numero: 'asc',
            },
        },
    },
};
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function normalizeNumero(value, numeroCifras) {
    const numericValue = Number(value);
    const maxValue = 10 ** numeroCifras - 1;
    if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > maxValue) {
        throw new app_error_1.AppError(`El numero "${value}" esta fuera del rango permitido para ${numeroCifras} cifras.`);
    }
    return String(numericValue).padStart(numeroCifras, '0');
}
async function listPremiosByRifa(rifaId) {
    return prismaClient().premio.findMany({
        where: { rifaId },
        include: premioInclude,
        orderBy: [{ fecha: 'asc' }, { nombre: 'asc' }],
    });
}
async function getPremioById(id) {
    const premio = await prismaClient().premio.findUnique({
        where: { id },
        include: premioInclude,
    });
    if (!premio) {
        throw new app_error_1.AppError('El premio no existe.', 404);
    }
    return premio;
}
async function createPremio(payload) {
    const prisma = prismaClient();
    const rifa = await prisma.rifa.findUnique({
        where: { id: payload.rifaId },
        select: { id: true },
    });
    if (!rifa) {
        throw new app_error_1.AppError('La rifa seleccionada no existe.', 404);
    }
    return prisma.premio.create({
        data: payload,
        include: premioInclude,
    });
}
async function updatePremio(id, payload) {
    await getPremioById(id);
    return prismaClient().premio.update({
        where: { id },
        data: payload,
        include: premioInclude,
    });
}
async function deletePremio(id) {
    const prisma = prismaClient();
    await getPremioById(id);
    await prisma.$transaction(async (tx) => {
        await tx.boletaPremio.deleteMany({
            where: { premioId: id },
        });
        await tx.premio.delete({
            where: { id },
        });
    });
}
async function updatePremioBoletas(id, payload) {
    const prisma = prismaClient();
    const premio = await getPremioById(id);
    const numeros = payload.numeros.map((numero) => normalizeNumero(numero, premio.rifa.numeroCifras));
    const boletas = numeros.length
        ? await prisma.boleta.findMany({
            where: {
                rifaId: premio.rifaId,
                numero: {
                    in: numeros,
                },
            },
            select: {
                id: true,
                numero: true,
            },
        })
        : [];
    const missingNumbers = numeros.filter((numero) => !boletas.some((boleta) => boleta.numero === numero));
    if (missingNumbers.length > 0) {
        throw new app_error_1.AppError(`Las siguientes boletas no existen en la rifa: ${missingNumbers.join(', ')}.`, 409);
    }
    await prisma.$transaction(async (tx) => {
        await tx.boletaPremio.deleteMany({
            where: { premioId: id },
        });
        if (boletas.length) {
            await tx.boletaPremio.createMany({
                data: boletas.map((boleta) => ({
                    premioId: id,
                    boletaId: boleta.id,
                })),
            });
        }
    });
    return getPremioById(id);
}
