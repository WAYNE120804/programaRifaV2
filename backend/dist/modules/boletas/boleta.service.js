"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBoletas = listBoletas;
exports.getBoletaById = getBoletaById;
exports.updateBoleta = updateBoleta;
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const boletaInclude = {
    rifa: {
        select: {
            id: true,
            nombre: true,
            numeroCifras: true,
            precioBoleta: true,
            estado: true,
        },
    },
    rifaVendedor: {
        select: {
            id: true,
            comisionPct: true,
            precioCasa: true,
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                    documento: true,
                    telefono: true,
                    direccion: true,
                },
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
async function listBoletas(filters) {
    const vendedorNombre = filters.vendedorNombre?.trim();
    return prismaClient().boleta.findMany({
        where: {
            ...(filters.rifaId ? { rifaId: filters.rifaId } : {}),
            ...(filters.rifaVendedorId ? { rifaVendedorId: filters.rifaVendedorId } : {}),
            ...(filters.estado ? { estado: filters.estado } : {}),
            ...(filters.numero ? { numero: { contains: filters.numero } } : {}),
            ...(typeof filters.juega === 'boolean' ? { juega: filters.juega } : {}),
            ...(vendedorNombre
                ? {
                    OR: [
                        {
                            rifaVendedor: {
                                vendedor: {
                                    nombre: {
                                        contains: vendedorNombre,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                        {
                            devueltaPorVendedorNombre: {
                                contains: vendedorNombre,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {}),
        },
        include: boletaInclude,
        orderBy: [{ numero: 'asc' }],
    });
}
async function getBoletaById(id) {
    const boleta = await prismaClient().boleta.findUnique({
        where: { id },
        include: boletaInclude,
    });
    if (!boleta) {
        throw new app_error_1.AppError('La boleta no existe.', 404);
    }
    return boleta;
}
async function updateBoleta(id, payload) {
    const prisma = prismaClient();
    const boleta = await getBoletaById(id);
    if (payload.estado === prisma_client_1.EstadoBoleta.DISPONIBLE) {
        return prisma.$transaction(async (tx) => {
            await tx.boletaPremio.deleteMany({
                where: {
                    boletaId: id,
                },
            });
            return tx.boleta.update({
                where: { id },
                data: {
                    estado: prisma_client_1.EstadoBoleta.DISPONIBLE,
                    rifaVendedorId: null,
                    juega: false,
                    devueltaPorVendedorNombre: null,
                    devueltaObservacion: null,
                },
                include: boletaInclude,
            });
        });
    }
    if (payload.estado === prisma_client_1.EstadoBoleta.ASIGNADA && !payload.rifaVendedorId) {
        throw new app_error_1.AppError('Para marcar una boleta como asignada debes seleccionar un vendedor.', 409);
    }
    if (payload.rifaVendedorId) {
        const relation = await prisma.rifaVendedor.findUnique({
            where: { id: payload.rifaVendedorId },
            select: {
                id: true,
                rifaId: true,
            },
        });
        if (!relation) {
            throw new app_error_1.AppError('La relacion rifa-vendedor seleccionada no existe.', 404);
        }
        if (relation.rifaId !== boleta.rifaId) {
            throw new app_error_1.AppError('La boleta solo se puede asignar a vendedores vinculados a la misma rifa.', 409);
        }
    }
    const requiresClearPremios = payload.estado === prisma_client_1.EstadoBoleta.DEVUELTA ||
        payload.estado === prisma_client_1.EstadoBoleta.ANULADA ||
        payload.rifaVendedorId !== boleta.rifaVendedorId;
    return prisma.$transaction(async (tx) => {
        if (requiresClearPremios) {
            await tx.boletaPremio.deleteMany({
                where: {
                    boletaId: id,
                },
            });
        }
        return tx.boleta.update({
            where: { id },
            data: {
                estado: payload.estado,
                rifaVendedorId: payload.rifaVendedorId,
                ...(requiresClearPremios
                    ? {
                        juega: false,
                    }
                    : {}),
                ...(payload.estado !== prisma_client_1.EstadoBoleta.DEVUELTA
                    ? {
                        devueltaPorVendedorNombre: null,
                        devueltaObservacion: null,
                    }
                    : {}),
            },
            include: boletaInclude,
        });
    });
}
