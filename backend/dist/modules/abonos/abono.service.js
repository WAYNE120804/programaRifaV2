"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAbonosByRifaVendedor = listAbonosByRifaVendedor;
exports.createAbono = createAbono;
exports.getReciboById = getReciboById;
exports.getReciboByCodigo = getReciboByCodigo;
exports.anularAbono = anularAbono;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const abonoInclude = {
    recibo: true,
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
    rifaVendedor: {
        select: {
            id: true,
            precioCasa: true,
            saldoActual: true,
            comisionPct: true,
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    numeroCifras: true,
                    precioBoleta: true,
                    estado: true,
                },
            },
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                    telefono: true,
                    documento: true,
                    direccion: true,
                },
            },
        },
    },
};
const reciboInclude = {
    abono: {
        include: abonoInclude,
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
    const words = rifaNombre
        .toUpperCase()
        .replace(/[^A-Z0-9\s]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    if (words.length === 0) {
        return 'RIFA';
    }
    if (words.length === 1) {
        return normalizeSegment(words[0]);
    }
    const initials = words.map((word) => word.charAt(0)).join('');
    return normalizeSegment(initials || words[0]);
}
function extractDocumentoSegment(documento) {
    const digits = (documento || '').replace(/\D+/g, '');
    return (digits.slice(-4) || '0000').padStart(4, '0');
}
function extractValorSegment(valor) {
    return String(Math.round(valor)).padStart(4, '0');
}
function buildCodigoUnico(input) {
    const rifaSegment = extractRifaSegment(input.rifaNombre);
    const documentoSegment = extractDocumentoSegment(input.documento);
    const consecutivoSegment = String(input.consecutivo).padStart(6, '0');
    const valorSegment = extractValorSegment(input.valor);
    return `${rifaSegment}-${documentoSegment}-${consecutivoSegment}-${valorSegment}`;
}
function decimalToNumber(value) {
    return Number(value);
}
async function getRifaVendedorOrFail(rifaVendedorId) {
    const relation = await prismaClient().rifaVendedor.findUnique({
        where: { id: rifaVendedorId },
        include: {
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    numeroCifras: true,
                    precioBoleta: true,
                },
            },
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                    telefono: true,
                    documento: true,
                    direccion: true,
                },
            },
        },
    });
    if (!relation) {
        throw new app_error_1.AppError('La relacion rifa-vendedor no existe.', 404);
    }
    return relation;
}
async function listAbonosByRifaVendedor(rifaVendedorId) {
    await getRifaVendedorOrFail(rifaVendedorId);
    return prismaClient().abonoVendedor.findMany({
        where: {
            rifaVendedorId,
        },
        include: abonoInclude,
        orderBy: {
            fecha: 'desc',
        },
    });
}
async function createAbono(rifaVendedorId, payload) {
    const prisma = prismaClient();
    const relation = await getRifaVendedorOrFail(rifaVendedorId);
    const saldoAnterior = decimalToNumber(relation.saldoActual);
    const subCaja = await prisma.subCaja.findUnique({
        where: { id: payload.subCajaId },
        include: {
            caja: {
                select: {
                    id: true,
                    rifaId: true,
                    nombre: true,
                },
            },
        },
    });
    if (saldoAnterior <= 0) {
        throw new app_error_1.AppError('Ese vendedor no tiene deuda pendiente para abonar.', 409);
    }
    if (!subCaja) {
        throw new app_error_1.AppError('La subcaja seleccionada no existe.', 404);
    }
    if (subCaja.caja.rifaId !== relation.rifaId) {
        throw new app_error_1.AppError('La subcaja seleccionada no pertenece a la rifa de este vendedor.', 409);
    }
    if (payload.valor > saldoAnterior) {
        throw new app_error_1.AppError(`El abono no puede ser mayor a la deuda actual del vendedor (${saldoAnterior}).`, 409);
    }
    return prisma.$transaction(async (tx) => {
        const [boletasActuales, ultimoRecibo] = await Promise.all([
            tx.boleta.count({
                where: {
                    rifaVendedorId,
                },
            }),
            tx.recibo.findFirst({
                select: {
                    consecutivo: true,
                },
                orderBy: {
                    consecutivo: 'desc',
                },
            }),
        ]);
        const saldoDespues = Number((saldoAnterior - payload.valor).toFixed(2));
        const consecutivo = (ultimoRecibo?.consecutivo || 0) + 1;
        const abono = await tx.abonoVendedor.create({
            data: {
                rifaVendedorId,
                subCajaId: payload.subCajaId,
                valor: payload.valor,
                fecha: payload.fecha || new Date(),
                descripcion: payload.descripcion,
                metodoPago: payload.metodoPago,
                estado: 'CONFIRMADO',
                saldoAnterior,
                saldoDespues,
                boletasActuales,
            },
        });
        await tx.rifaVendedor.update({
            where: { id: rifaVendedorId },
            data: {
                saldoActual: saldoDespues,
            },
        });
        await Promise.all([
            tx.caja.update({
                where: { id: subCaja.caja.id },
                data: {
                    saldo: {
                        increment: payload.valor,
                    },
                },
            }),
            tx.subCaja.update({
                where: { id: payload.subCajaId },
                data: {
                    saldo: {
                        increment: payload.valor,
                    },
                },
            }),
        ]);
        await tx.movimientoCaja.create({
            data: {
                tipo: 'INGRESO',
                valor: payload.valor,
                descripcion: payload.descripcion ||
                    `Abono de ${relation.vendedor.nombre} a la rifa ${relation.rifa.nombre}`,
                fecha: payload.fecha || new Date(),
                cajaId: subCaja.caja.id,
                subCajaId: payload.subCajaId,
                rifaId: relation.rifa.id,
                vendedorId: relation.vendedor.id,
                abonoVendedorId: abono.id,
            },
        });
        const recibo = await tx.recibo.create({
            data: {
                abonoId: abono.id,
                consecutivo,
                codigoUnico: buildCodigoUnico({
                    rifaNombre: relation.rifa.nombre,
                    documento: relation.vendedor.documento,
                    consecutivo,
                    valor: payload.valor,
                }),
                fecha: payload.fecha || new Date(),
            },
            include: reciboInclude,
        });
        return recibo;
    });
}
async function getReciboById(id) {
    const recibo = await prismaClient().recibo.findUnique({
        where: { id },
        include: reciboInclude,
    });
    if (!recibo) {
        throw new app_error_1.AppError('El recibo no existe.', 404);
    }
    return recibo;
}
async function getReciboByCodigo(codigo) {
    const recibo = await prismaClient().recibo.findUnique({
        where: {
            codigoUnico: codigo,
        },
        include: reciboInclude,
    });
    if (!recibo) {
        throw new app_error_1.AppError('No existe un recibo con ese codigo.', 404);
    }
    return recibo;
}
async function anularAbono(abonoId, payload) {
    const prisma = prismaClient();
    const abono = (await prisma.abonoVendedor.findUnique({
        where: { id: abonoId },
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
            rifaVendedor: {
                include: {
                    vendedor: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                    rifa: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            },
        },
    }));
    if (!abono) {
        throw new app_error_1.AppError('El abono no existe.', 404);
    }
    if (abono.anuladoAt || abono.estado === 'RECHAZADO') {
        throw new app_error_1.AppError('El abono ya fue anulado.', 409);
    }
    if (!abono.subCaja?.caja?.id) {
        throw new app_error_1.AppError('El abono no tiene subcaja valida para reversar caja.', 409);
    }
    return prisma.$transaction(async (tx) => {
        const nuevoSaldo = Number((Number(abono.rifaVendedor.saldoActual) + Number(abono.valor)).toFixed(2));
        await tx.rifaVendedor.update({
            where: { id: abono.rifaVendedorId },
            data: {
                saldoActual: nuevoSaldo,
            },
        });
        await Promise.all([
            tx.caja.update({
                where: { id: abono.subCaja.caja.id },
                data: {
                    saldo: {
                        decrement: Number(abono.valor),
                    },
                },
            }),
            tx.subCaja.update({
                where: { id: abono.subCajaId },
                data: {
                    saldo: {
                        decrement: Number(abono.valor),
                    },
                },
            }),
        ]);
        await tx.movimientoCaja.create({
            data: {
                tipo: 'EGRESO',
                valor: Number(abono.valor),
                descripcion: `Anulacion de abono: ${payload.motivo}`,
                fecha: new Date(),
                cajaId: abono.subCaja.caja.id,
                subCajaId: abono.subCajaId,
                rifaId: abono.rifaVendedor.rifa.id,
                vendedorId: abono.rifaVendedor.vendedor.id,
                abonoVendedorId: abono.id,
            },
        });
        const updateData = {
            estado: 'RECHAZADO',
            anuladoAt: new Date(),
            anuladoMotivo: payload.motivo,
        };
        await tx.abonoVendedor.update({
            where: { id: abono.id },
            data: updateData,
        });
    });
}
