"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCajas = listCajas;
exports.getCajaById = getCajaById;
exports.listSubCajasByRifa = listSubCajasByRifa;
exports.createSubCaja = createSubCaja;
exports.deleteSubCaja = deleteSubCaja;
exports.getCajaResumenByRifa = getCajaResumenByRifa;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const cajaInclude = {
    rifa: {
        select: {
            id: true,
            nombre: true,
            precioBoleta: true,
        },
    },
    subcajas: {
        orderBy: {
            nombre: 'asc',
        },
    },
};
const movimientoInclude = {
    subCaja: {
        select: {
            id: true,
            nombre: true,
        },
    },
    vendedor: {
        select: {
            id: true,
            nombre: true,
        },
    },
    gasto: {
        select: {
            id: true,
            descripcion: true,
            categoria: true,
        },
    },
    abonoVendedor: {
        select: {
            id: true,
            valor: true,
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
function toNumber(value) {
    return Number(value || 0);
}
async function getCajaPrincipalByRifaId(rifaId) {
    const caja = await prismaClient().caja.findFirst({
        where: { rifaId },
        include: cajaInclude,
    });
    if (!caja) {
        throw new app_error_1.AppError('La rifa seleccionada no tiene caja principal creada.', 404);
    }
    return caja;
}
async function listCajas(rifaId) {
    return prismaClient().caja.findMany({
        where: {
            ...(rifaId ? { rifaId } : {}),
        },
        include: cajaInclude,
        orderBy: {
            rifa: {
                nombre: 'asc',
            },
        },
    });
}
async function getCajaById(id) {
    const caja = await prismaClient().caja.findUnique({
        where: { id },
        include: {
            ...cajaInclude,
            movimientos: {
                include: movimientoInclude,
                orderBy: {
                    fecha: 'desc',
                },
                take: 100,
            },
        },
    });
    if (!caja) {
        throw new app_error_1.AppError('La caja no existe.', 404);
    }
    return caja;
}
async function listSubCajasByRifa(rifaId) {
    const caja = await getCajaPrincipalByRifaId(rifaId);
    return caja.subcajas;
}
async function createSubCaja(payload) {
    const prisma = prismaClient();
    const caja = await getCajaPrincipalByRifaId(payload.rifaId);
    const existing = await prisma.subCaja.findFirst({
        where: {
            cajaId: caja.id,
            nombre: payload.nombre,
        },
    });
    if (existing) {
        throw new app_error_1.AppError('Ya existe una subcaja con ese nombre en la rifa seleccionada.', 409);
    }
    return prisma.subCaja.create({
        data: {
            cajaId: caja.id,
            nombre: payload.nombre,
            saldo: 0,
        },
    });
}
async function deleteSubCaja(id) {
    const prisma = prismaClient();
    const subCaja = await prisma.subCaja.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    movimientos: true,
                    abonos: true,
                    gastos: true,
                },
            },
        },
    });
    if (!subCaja) {
        throw new app_error_1.AppError('La subcaja no existe.', 404);
    }
    if (toNumber(subCaja.saldo) !== 0 ||
        subCaja._count.movimientos > 0 ||
        subCaja._count.abonos > 0 ||
        subCaja._count.gastos > 0) {
        throw new app_error_1.AppError('La subcaja no se puede eliminar porque ya tiene saldo, abonos, gastos o movimientos asociados.', 409);
    }
    await prisma.subCaja.delete({
        where: { id },
    });
}
async function getCajaResumenByRifa(rifaId) {
    const prisma = prismaClient();
    const caja = await getCajaPrincipalByRifaId(rifaId);
    const [movimientos, relaciones, gastosActivos] = await Promise.all([
        prisma.movimientoCaja.findMany({
            where: {
                cajaId: caja.id,
            },
            include: movimientoInclude,
            orderBy: {
                fecha: 'desc',
            },
        }),
        prisma.rifaVendedor.findMany({
            where: {
                rifaId,
            },
            include: {
                vendedor: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                        documento: true,
                    },
                },
                _count: {
                    select: {
                        boletas: true,
                        abonos: true,
                    },
                },
                abonos: {
                    where: {
                        estado: 'CONFIRMADO',
                        anuladoAt: null,
                    },
                    select: {
                        id: true,
                        valor: true,
                        fecha: true,
                        subCaja: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                    orderBy: {
                        fecha: 'desc',
                    },
                },
                rifa: {
                    select: {
                        id: true,
                        nombre: true,
                        precioBoleta: true,
                    },
                },
            },
            orderBy: {
                vendedor: {
                    nombre: 'asc',
                },
            },
        }),
        prisma.gasto.findMany({
            where: {
                rifaId,
                anuladoAt: null,
            },
            select: {
                id: true,
                valor: true,
                categoria: true,
                subCajaId: true,
            },
        }),
    ]);
    const abonosActivos = relaciones.flatMap((relation) => relation.abonos.map((abono) => ({
        ...abono,
        rifaVendedorId: relation.id,
    })));
    const vendorResumen = relaciones.map((relation) => {
        const totalBoletas = relation._count.boletas;
        const dineroARecoger = Number((totalBoletas * toNumber(relation.precioCasa)).toFixed(2));
        const dineroRecogido = Number(relation.abonos.reduce((sum, item) => sum + toNumber(item.valor), 0).toFixed(2));
        const faltante = Number((dineroARecoger - dineroRecogido).toFixed(2));
        return {
            id: relation.id,
            vendedor: relation.vendedor,
            totalBoletas,
            dineroARecoger,
            dineroRecogido,
            faltante,
            saldoActual: toNumber(relation.saldoActual),
            precioCasa: toNumber(relation.precioCasa),
            precioBoleta: toNumber(relation.rifa.precioBoleta),
            estadoCuenta: faltante < 0 ? 'SALDO_A_FAVOR' : faltante > 0 ? 'PENDIENTE' : 'AL_DIA',
        };
    });
    const subCajaResumen = caja.subcajas.map((subCaja) => {
        const ingresos = abonosActivos
            .filter((abono) => abono.subCaja?.id === subCaja.id)
            .reduce((sum, abono) => sum + toNumber(abono.valor), 0);
        const egresos = gastosActivos
            .filter((gasto) => gasto.subCajaId === subCaja.id)
            .reduce((sum, gasto) => sum + toNumber(gasto.valor), 0);
        return {
            id: subCaja.id,
            nombre: subCaja.nombre,
            saldo: toNumber(subCaja.saldo),
            ingresosAbonos: Number(ingresos.toFixed(2)),
            egresosGastos: Number(egresos.toFixed(2)),
            movimientos: movimientos.filter((movimiento) => movimiento.subCajaId === subCaja.id).length,
        };
    });
    const dineroPorRecoger = vendorResumen.reduce((sum, item) => sum + item.dineroARecoger, 0);
    const dineroRecogido = vendorResumen.reduce((sum, item) => sum + item.dineroRecogido, 0);
    const dineroFaltante = vendorResumen.reduce((sum, item) => sum + item.faltante, 0);
    const totalGastos = gastosActivos.reduce((sum, gasto) => sum + toNumber(gasto.valor), 0);
    const totalIngresos = abonosActivos.reduce((sum, abono) => sum + toNumber(abono.valor), 0);
    return {
        rifa: caja.rifa,
        cajaGeneral: {
            id: caja.id,
            nombre: caja.nombre,
            saldo: toNumber(caja.saldo),
        },
        metricas: {
            dineroPorRecoger: Number(dineroPorRecoger.toFixed(2)),
            dineroRecogido: Number(dineroRecogido.toFixed(2)),
            dineroFaltante: Number(dineroFaltante.toFixed(2)),
            totalIngresos: Number(totalIngresos.toFixed(2)),
            totalGastos: Number(totalGastos.toFixed(2)),
        },
        subcajas: subCajaResumen,
        vendedores: vendorResumen,
        movimientosRecientes: movimientos.slice(0, 20),
    };
}
