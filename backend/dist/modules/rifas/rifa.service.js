"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRifas = listRifas;
exports.getRifaById = getRifaById;
exports.createRifa = createRifa;
exports.updateRifa = updateRifa;
exports.deleteRifa = deleteRifa;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const rifaListSelect = {
    id: true,
    nombre: true,
    loteriaNombre: true,
    numeroCifras: true,
    fechaInicio: true,
    fechaFin: true,
    precioBoleta: true,
    estado: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            vendedores: true,
            boletas: true,
            premios: true,
        },
    },
};
const rifaDetailInclude = {
    vendedores: {
        select: {
            id: true,
            comisionPct: true,
            precioCasa: true,
            saldoActual: true,
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                    telefono: true,
                    documento: true,
                },
            },
        },
        orderBy: {
            vendedor: {
                nombre: 'asc',
            },
        },
    },
    cajas: {
        select: {
            id: true,
            nombre: true,
            saldo: true,
        },
        orderBy: {
            nombre: 'asc',
        },
    },
    premios: {
        select: {
            id: true,
            nombre: true,
            descripcion: true,
            tipo: true,
            valor: true,
            fecha: true,
            _count: {
                select: {
                    boletas: true,
                },
            },
        },
        orderBy: [{ fecha: 'asc' }, { nombre: 'asc' }],
    },
    _count: {
        select: {
            vendedores: true,
            boletas: true,
            premios: true,
            gastos: true,
            ventas: true,
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
function buildBoletas(rifaId, numeroCifras, precioBoleta) {
    const total = 10 ** numeroCifras;
    const boletas = [];
    for (let index = 0; index < total; index += 1) {
        boletas.push({
            rifaId,
            numero: String(index).padStart(numeroCifras, '0'),
            precio: precioBoleta,
        });
    }
    return boletas;
}
async function listRifas() {
    return prismaClient().rifa.findMany({
        select: rifaListSelect,
        orderBy: {
            createdAt: 'desc',
        },
    });
}
async function getRifaById(id) {
    const rifa = await prismaClient().rifa.findUnique({
        where: { id },
        include: rifaDetailInclude,
    });
    if (!rifa) {
        throw new app_error_1.AppError('Rifa no encontrada.', 404);
    }
    return rifa;
}
async function createRifa(payload) {
    const prisma = prismaClient();
    return prisma.$transaction(async (tx) => {
        const rifa = await tx.rifa.create({
            data: payload,
            include: rifaDetailInclude,
        });
        const boletas = buildBoletas(rifa.id, payload.numeroCifras, payload.precioBoleta);
        await tx.boleta.createMany({
            data: boletas,
        });
        await tx.caja.create({
            data: {
                nombre: 'Caja principal',
                saldo: 0,
                rifaId: rifa.id,
            },
        });
        return tx.rifa.findUniqueOrThrow({
            where: { id: rifa.id },
            include: rifaDetailInclude,
        });
    });
}
async function updateRifa(id, payload) {
    const existing = await getRifaById(id);
    if (existing.numeroCifras !== payload.numeroCifras &&
        existing._count.boletas > 0) {
        throw new app_error_1.AppError('No se puede cambiar el numero de cifras porque la rifa ya tiene boletas generadas.', 409);
    }
    return prismaClient().rifa.update({
        where: { id },
        data: payload,
        include: rifaDetailInclude,
    });
}
async function deleteRifa(id) {
    const prisma = prismaClient();
    const rifa = await getRifaById(id);
    if (rifa._count.boletas > 0 || rifa._count.vendedores > 0 || rifa._count.ventas > 0) {
        throw new app_error_1.AppError('La rifa no se puede eliminar porque ya tiene boletas, vendedores o ventas asociadas.', 409);
    }
    await prisma.$transaction(async (tx) => {
        await tx.caja.deleteMany({
            where: { rifaId: id },
        });
        await tx.rifa.delete({
            where: { id },
        });
    });
}
