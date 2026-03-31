"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGastos = listGastos;
exports.getGastoById = getGastoById;
exports.createGasto = createGasto;
exports.getGastoReciboById = getGastoReciboById;
exports.getGastoReciboByCodigo = getGastoReciboByCodigo;
exports.anularGasto = anularGasto;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const gastoInclude = {
    rifa: {
        select: {
            id: true,
            nombre: true,
            precioBoleta: true,
            numeroCifras: true,
        },
    },
    subCaja: {
        select: {
            id: true,
            nombre: true,
            caja: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
        },
    },
    recibo: true,
};
const gastoReciboInclude = {
    gasto: {
        include: gastoInclude,
    },
};
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function normalizeSegment(value) {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 8);
}
function extractRifaSegment(rifaNombre) {
    const words = String(rifaNombre || '')
        .toUpperCase()
        .replace(/[^A-Z0-9\s]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    if (words.length === 0) {
        return 'GASTO';
    }
    if (words.length === 1) {
        return normalizeSegment(words[0]);
    }
    return normalizeSegment(words.map((word) => word.charAt(0)).join('') || words[0]);
}
function extractValorSegment(valor) {
    return String(Math.round(valor)).padStart(4, '0');
}
function buildCodigoUnico(input) {
    const rifaSegment = extractRifaSegment(input.rifaNombre);
    const consecutivoSegment = String(input.consecutivo).padStart(6, '0');
    const valorSegment = extractValorSegment(input.valor);
    return `GST-${rifaSegment}-${consecutivoSegment}-${valorSegment}`;
}
async function listGastos(filters) {
    return prismaClient().gasto.findMany({
        where: {
            ...(filters?.rifaId ? { rifaId: filters.rifaId } : {}),
            ...(filters?.categoria ? { categoria: filters.categoria } : {}),
        },
        include: gastoInclude,
        orderBy: {
            fecha: 'desc',
        },
    });
}
async function getGastoById(id) {
    const gasto = await prismaClient().gasto.findUnique({
        where: { id },
        include: gastoInclude,
    });
    if (!gasto) {
        throw new app_error_1.AppError('El gasto no existe.', 404);
    }
    return gasto;
}
async function createGasto(payload) {
    const prisma = prismaClient();
    const rifa = await prisma.rifa.findUnique({
        where: { id: payload.rifaId },
        select: {
            id: true,
            nombre: true,
        },
    });
    if (!rifa) {
        throw new app_error_1.AppError('La rifa seleccionada no existe.', 404);
    }
    let subCaja = null;
    if (payload.subCajaId) {
        subCaja = await prisma.subCaja.findUnique({
            where: { id: payload.subCajaId },
            select: {
                id: true,
                nombre: true,
                caja: {
                    select: {
                        id: true,
                        rifaId: true,
                    },
                },
            },
        });
        if (!subCaja) {
            throw new app_error_1.AppError('La subcaja seleccionada no existe.', 404);
        }
        if (subCaja.caja.rifaId !== payload.rifaId) {
            throw new app_error_1.AppError('La subcaja seleccionada no pertenece a la rifa del gasto.', 409);
        }
    }
    return prisma.$transaction(async (tx) => {
        const ultimoRecibo = await tx.gastoRecibo.findFirst({
            select: {
                consecutivo: true,
            },
            orderBy: {
                consecutivo: 'desc',
            },
        });
        const consecutivo = (ultimoRecibo?.consecutivo || 0) + 1;
        const fecha = payload.fecha || new Date();
        const gasto = await tx.gasto.create({
            data: {
                rifaId: payload.rifaId,
                subCajaId: payload.subCajaId,
                categoria: payload.categoria,
                valor: payload.valor,
                fecha,
                descripcion: payload.descripcion,
            },
        });
        if (subCaja) {
            await Promise.all([
                tx.caja.update({
                    where: { id: subCaja.caja.id },
                    data: {
                        saldo: {
                            decrement: payload.valor,
                        },
                    },
                }),
                tx.subCaja.update({
                    where: { id: subCaja.id },
                    data: {
                        saldo: {
                            decrement: payload.valor,
                        },
                    },
                }),
            ]);
            await tx.movimientoCaja.create({
                data: {
                    tipo: 'EGRESO',
                    valor: payload.valor,
                    descripcion: payload.descripcion,
                    fecha,
                    cajaId: subCaja.caja.id,
                    subCajaId: subCaja.id,
                    rifaId: payload.rifaId,
                    gastoId: gasto.id,
                },
            });
        }
        const recibo = await tx.gastoRecibo.create({
            data: {
                gastoId: gasto.id,
                consecutivo,
                codigoUnico: buildCodigoUnico({
                    rifaNombre: rifa.nombre,
                    consecutivo,
                    valor: payload.valor,
                }),
                fecha,
            },
            include: gastoReciboInclude,
        });
        return recibo;
    });
}
async function getGastoReciboById(id) {
    const recibo = await prismaClient().gastoRecibo.findUnique({
        where: { id },
        include: gastoReciboInclude,
    });
    if (!recibo) {
        throw new app_error_1.AppError('El recibo de gasto no existe.', 404);
    }
    return recibo;
}
async function getGastoReciboByCodigo(codigo) {
    const recibo = await prismaClient().gastoRecibo.findUnique({
        where: { codigoUnico: codigo },
        include: gastoReciboInclude,
    });
    if (!recibo) {
        throw new app_error_1.AppError('No existe un recibo de gasto con ese codigo.', 404);
    }
    return recibo;
}
async function anularGasto(gastoId, payload) {
    const prisma = prismaClient();
    const gasto = (await prisma.gasto.findUnique({
        where: { id: gastoId },
        include: {
            subCaja: {
                include: {
                    caja: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
    }));
    if (!gasto) {
        throw new app_error_1.AppError('El gasto no existe.', 404);
    }
    if (gasto.anuladoAt) {
        throw new app_error_1.AppError('El gasto ya fue anulado.', 409);
    }
    return prisma.$transaction(async (tx) => {
        if (gasto.subCaja?.caja?.id && gasto.subCajaId) {
            await Promise.all([
                tx.caja.update({
                    where: { id: gasto.subCaja.caja.id },
                    data: {
                        saldo: {
                            increment: Number(gasto.valor),
                        },
                    },
                }),
                tx.subCaja.update({
                    where: { id: gasto.subCajaId },
                    data: {
                        saldo: {
                            increment: Number(gasto.valor),
                        },
                    },
                }),
            ]);
            await tx.movimientoCaja.create({
                data: {
                    tipo: 'INGRESO',
                    valor: Number(gasto.valor),
                    descripcion: `Anulacion de gasto: ${payload.motivo}`,
                    fecha: new Date(),
                    cajaId: gasto.subCaja.caja.id,
                    subCajaId: gasto.subCajaId,
                    rifaId: gasto.rifaId,
                    gastoId: gasto.id,
                },
            });
        }
        const updateData = {
            anuladoAt: new Date(),
            anuladoMotivo: payload.motivo,
        };
        await tx.gasto.update({
            where: { id: gasto.id },
            data: updateData,
        });
    });
}
