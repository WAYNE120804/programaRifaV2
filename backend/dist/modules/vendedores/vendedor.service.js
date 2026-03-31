"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVendedores = listVendedores;
exports.getVendedorById = getVendedorById;
exports.createVendedor = createVendedor;
exports.updateVendedor = updateVendedor;
exports.deleteVendedor = deleteVendedor;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const vendedorListSelect = {
    id: true,
    nombre: true,
    telefono: true,
    documento: true,
    direccion: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            rifas: true,
            movimientos: true,
        },
    },
};
const vendedorDetailInclude = {
    rifas: {
        select: {
            id: true,
            comisionPct: true,
            precioCasa: true,
            saldoActual: true,
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    estado: true,
                },
            },
        },
        orderBy: {
            rifa: {
                createdAt: 'desc',
            },
        },
    },
    _count: {
        select: {
            rifas: true,
            movimientos: true,
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
async function listVendedores() {
    return prismaClient().vendedor.findMany({
        select: vendedorListSelect,
        orderBy: {
            createdAt: 'desc',
        },
    });
}
async function getVendedorById(id) {
    const vendedor = await prismaClient().vendedor.findUnique({
        where: { id },
        include: vendedorDetailInclude,
    });
    if (!vendedor) {
        throw new app_error_1.AppError('Vendedor no encontrado.', 404);
    }
    return vendedor;
}
async function createVendedor(payload) {
    return prismaClient().vendedor.create({
        data: payload,
        include: vendedorDetailInclude,
    });
}
async function updateVendedor(id, payload) {
    await getVendedorById(id);
    return prismaClient().vendedor.update({
        where: { id },
        data: payload,
        include: vendedorDetailInclude,
    });
}
async function deleteVendedor(id) {
    const prisma = prismaClient();
    const vendedor = await getVendedorById(id);
    if (vendedor._count.rifas > 0 || vendedor._count.movimientos > 0) {
        throw new app_error_1.AppError('El vendedor no se puede eliminar porque ya tiene rifas o movimientos asociados.', 409);
    }
    await prisma.vendedor.delete({
        where: { id },
    });
}
