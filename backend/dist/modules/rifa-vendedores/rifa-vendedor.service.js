"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRifaVendedores = listRifaVendedores;
exports.getRifaVendedorById = getRifaVendedorById;
exports.createRifaVendedor = createRifaVendedor;
exports.deleteRifaVendedor = deleteRifaVendedor;
exports.updateRifaVendedor = updateRifaVendedor;
exports.listAsignacionesByRifaVendedor = listAsignacionesByRifaVendedor;
exports.createAsignacion = createAsignacion;
exports.listDevolucionesByRifaVendedor = listDevolucionesByRifaVendedor;
exports.createDevolucion = createDevolucion;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const rifaVendedorInclude = {
    rifa: {
        select: {
            id: true,
            nombre: true,
            estado: true,
            precioBoleta: true,
            numeroCifras: true,
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
    _count: {
        select: {
            boletas: true,
            asignaciones: true,
            devoluciones: true,
            abonos: true,
        },
    },
};
const asignacionInclude = {
    rifaVendedor: {
        select: {
            id: true,
            comisionPct: true,
            precioCasa: true,
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                    telefono: true,
                    direccion: true,
                },
            },
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    numeroCifras: true,
                },
            },
            abonos: {
                where: {
                    estado: 'CONFIRMADO',
                    anuladoAt: null,
                },
                select: {
                    valor: true,
                },
            },
        },
    },
    detalle: {
        select: {
            id: true,
            boleta: {
                select: {
                    id: true,
                    numero: true,
                    estado: true,
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
const devolucionInclude = {
    rifaVendedor: {
        select: {
            id: true,
            comisionPct: true,
            precioCasa: true,
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
                    numeroCifras: true,
                },
            },
            abonos: {
                where: {
                    estado: 'CONFIRMADO',
                    anuladoAt: null,
                },
                select: {
                    valor: true,
                },
            },
        },
    },
    detalle: {
        select: {
            id: true,
            boleta: {
                select: {
                    id: true,
                    numero: true,
                    estado: true,
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
function withTotalAbonado(item) {
    const totalAbonado = Number((item.abonos || []).reduce((sum, current) => sum + Number(current.valor || 0), 0));
    return {
        ...item,
        totalAbonado,
    };
}
function calculatePrecioCasa(precioBoleta, comisionPct) {
    const precio = Number(precioBoleta);
    const comision = (precio * comisionPct) / 100;
    return Number((precio - comision).toFixed(2));
}
function normalizeNumero(value, numeroCifras) {
    const match = value.match(/\d+/);
    if (!match) {
        throw new app_error_1.AppError(`El valor "${value}" no contiene un numero valido.`);
    }
    const numericValue = Number(match[0]);
    const maxValue = 10 ** numeroCifras - 1;
    if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > maxValue) {
        throw new app_error_1.AppError(`El numero "${value}" esta fuera del rango permitido para ${numeroCifras} cifras.`);
    }
    return String(numericValue).padStart(numeroCifras, '0');
}
function parseListaNumeros(rawValue, numeroCifras) {
    const matches = rawValue.match(/\d+/g);
    if (!matches || matches.length === 0) {
        throw new app_error_1.AppError('La lista de boletas no contiene numeros validos para asignar.');
    }
    return [...new Set(matches.map((item) => normalizeNumero(item, numeroCifras)))];
}
function shuffleArray(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
}
function buildPartialAssignmentError(message, unavailable, availableNumbers) {
    return new app_error_1.AppError(message, 409, {
        errorCode: 'PARTIAL_ASSIGNMENT_CONFLICT',
        details: {
            unavailable: unavailable.map((item) => ({
                numero: item.numero,
                estado: item.estado,
                vendedorNombre: item.rifaVendedor?.vendedor?.nombre || null,
            })),
            availableNumbers,
        },
    });
}
function buildPartialReturnError(message, unavailable, availableNumbers) {
    return new app_error_1.AppError(message, 409, {
        errorCode: 'PARTIAL_RETURN_CONFLICT',
        details: {
            unavailable: unavailable.map((item) => ({
                numero: item.numero,
                estado: item.estado,
                vendedorNombre: item.rifaVendedor?.vendedor?.nombre || null,
            })),
            availableNumbers,
        },
    });
}
async function listRifaVendedores(filters) {
    const rows = await prismaClient().rifaVendedor.findMany({
        where: {
            ...(filters?.rifaId ? { rifaId: filters.rifaId } : {}),
            ...(filters?.vendedorId ? { vendedorId: filters.vendedorId } : {}),
        },
        include: rifaVendedorInclude,
        orderBy: [
            {
                rifa: {
                    nombre: 'asc',
                },
            },
            {
                vendedor: {
                    nombre: 'asc',
                },
            },
        ],
    });
    return rows.map(withTotalAbonado);
}
async function getRifaVendedorById(id) {
    const relation = await prismaClient().rifaVendedor.findUnique({
        where: { id },
        include: rifaVendedorInclude,
    });
    if (!relation) {
        throw new app_error_1.AppError('La relacion rifa-vendedor no existe.', 404);
    }
    return withTotalAbonado(relation);
}
async function createRifaVendedor(payload) {
    const prisma = prismaClient();
    const [rifa, vendedor, existing] = await Promise.all([
        prisma.rifa.findUnique({ where: { id: payload.rifaId } }),
        prisma.vendedor.findUnique({ where: { id: payload.vendedorId } }),
        prisma.rifaVendedor.findUnique({
            where: {
                rifaId_vendedorId: {
                    rifaId: payload.rifaId,
                    vendedorId: payload.vendedorId,
                },
            },
        }),
    ]);
    if (!rifa) {
        throw new app_error_1.AppError('La rifa seleccionada no existe.', 404);
    }
    if (!vendedor) {
        throw new app_error_1.AppError('El vendedor seleccionado no existe.', 404);
    }
    if (existing) {
        throw new app_error_1.AppError('Ese vendedor ya esta vinculado a la rifa seleccionada.', 409);
    }
    const precioCasa = calculatePrecioCasa(rifa.precioBoleta, payload.comisionPct);
    return prisma.rifaVendedor.create({
        data: {
            ...payload,
            precioCasa,
        },
        include: rifaVendedorInclude,
    });
}
async function deleteRifaVendedor(id) {
    const prisma = prismaClient();
    const relation = await getRifaVendedorById(id);
    if (relation._count.boletas > 0 ||
        relation._count.asignaciones > 0 ||
        relation._count.devoluciones > 0 ||
        relation._count.abonos > 0) {
        throw new app_error_1.AppError('La relacion no se puede eliminar porque ya tiene boletas, asignaciones, devoluciones o abonos asociados.', 409);
    }
    await prisma.rifaVendedor.delete({
        where: { id },
    });
}
async function updateRifaVendedor(id, payload) {
    const relation = await getRifaVendedorById(id);
    const precioCasa = calculatePrecioCasa(relation.rifa.precioBoleta, payload.comisionPct);
    return prismaClient().rifaVendedor.update({
        where: { id },
        data: {
            comisionPct: payload.comisionPct,
            precioCasa,
        },
        include: rifaVendedorInclude,
    });
}
async function listAsignacionesByRifaVendedor(id) {
    await getRifaVendedorById(id);
    const rows = await prismaClient().asignacionBoletas.findMany({
        where: {
            rifaVendedorId: id,
        },
        include: asignacionInclude,
        orderBy: {
            fecha: 'desc',
        },
    });
    return rows.map((row) => ({
        ...row,
        accion: 'ASIGNACION',
        totalTransaccion: Number(row.detalle.length) * Number(row.rifaVendedor.precioCasa),
        rifaVendedor: withTotalAbonado(row.rifaVendedor),
    }));
}
async function createAsignacion(rifaVendedorId, payload) {
    const prisma = prismaClient();
    const relation = await prisma.rifaVendedor.findUnique({
        where: { id: rifaVendedorId },
        include: {
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    numeroCifras: true,
                },
            },
        },
    });
    if (!relation) {
        throw new app_error_1.AppError('La relacion rifa-vendedor no existe.', 404);
    }
    return prisma.$transaction(async (tx) => {
        let selectedBoletas = [];
        if (payload.metodo === 'ALEATORIA') {
            const disponibles = await tx.boleta.findMany({
                where: {
                    rifaId: relation.rifaId,
                    estado: 'DISPONIBLE',
                    rifaVendedorId: null,
                },
                select: {
                    id: true,
                    numero: true,
                },
                orderBy: {
                    numero: 'asc',
                },
            });
            if (disponibles.length < (payload.cantidad || 0)) {
                throw new app_error_1.AppError(`No hay suficientes boletas disponibles. Disponibles: ${disponibles.length}.`, 409);
            }
            selectedBoletas = shuffleArray(disponibles.map((item) => item.numero))
                .slice(0, payload.cantidad)
                .sort((left, right) => left.localeCompare(right))
                .map((numero) => disponibles.find((item) => item.numero === numero))
                .filter(Boolean);
        }
        if (payload.metodo === 'RANGO') {
            const numeroDesde = normalizeNumero(payload.numeroDesde || '', relation.rifa.numeroCifras);
            const numeroHasta = normalizeNumero(payload.numeroHasta || '', relation.rifa.numeroCifras);
            if (numeroDesde > numeroHasta) {
                throw new app_error_1.AppError('El rango no es valido: "numeroDesde" debe ser menor o igual a "numeroHasta".');
            }
            const totalEsperado = Number(numeroHasta) - Number(numeroDesde) + 1;
            const boletasEnRango = await tx.boleta.findMany({
                where: {
                    rifaId: relation.rifaId,
                    numero: {
                        gte: numeroDesde,
                        lte: numeroHasta,
                    },
                },
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                    rifaVendedorId: true,
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
                orderBy: {
                    numero: 'asc',
                },
            });
            if (boletasEnRango.length !== totalEsperado) {
                throw new app_error_1.AppError('El rango solicitado contiene numeros que no existen dentro de la rifa.', 409);
            }
            const noDisponibles = boletasEnRango.filter((item) => item.estado !== 'DISPONIBLE' || item.rifaVendedorId);
            if (noDisponibles.length > 0) {
                const disponibles = boletasEnRango
                    .filter((item) => item.estado === 'DISPONIBLE' && !item.rifaVendedorId)
                    .map((item) => item.numero);
                if (!payload.permitirParcial || disponibles.length === 0) {
                    throw buildPartialAssignmentError(`El rango contiene boletas no disponibles: ${noDisponibles
                        .slice(0, 10)
                        .map((item) => item.numero)
                        .join(', ')}.`, noDisponibles, disponibles);
                }
            }
            selectedBoletas = boletasEnRango
                .filter((item) => item.estado === 'DISPONIBLE' && !item.rifaVendedorId)
                .map(({ id, numero }) => ({ id, numero }));
        }
        if (payload.metodo === 'LISTA') {
            const numeros = parseListaNumeros(payload.listaNumeros || '', relation.rifa.numeroCifras);
            const boletas = await tx.boleta.findMany({
                where: {
                    rifaId: relation.rifaId,
                    numero: {
                        in: numeros,
                    },
                },
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                    rifaVendedorId: true,
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
                orderBy: {
                    numero: 'asc',
                },
            });
            const boletaMap = new Map(boletas.map((item) => [item.numero, item]));
            const faltantes = numeros.filter((numero) => !boletaMap.has(numero));
            if (faltantes.length > 0) {
                throw new app_error_1.AppError(`Las siguientes boletas no existen en la rifa: ${faltantes.join(', ')}.`, 409);
            }
            const noDisponibles = boletas.filter((item) => item.estado !== 'DISPONIBLE' || item.rifaVendedorId);
            if (noDisponibles.length > 0) {
                const disponibles = boletas
                    .filter((item) => item.estado === 'DISPONIBLE' && !item.rifaVendedorId)
                    .map((item) => item.numero);
                if (!payload.permitirParcial || disponibles.length === 0) {
                    throw buildPartialAssignmentError(`Las siguientes boletas no estan disponibles: ${noDisponibles
                        .slice(0, 10)
                        .map((item) => item.numero)
                        .join(', ')}.`, noDisponibles, disponibles);
                }
            }
            selectedBoletas = numeros
                .map((numero) => boletaMap.get(numero))
                .filter(Boolean)
                .filter((item) => item.estado === 'DISPONIBLE' && !item.rifaVendedorId)
                .map((item) => ({ id: item.id, numero: item.numero }));
        }
        if (selectedBoletas.length === 0) {
            throw new app_error_1.AppError('No se encontraron boletas para asignar.', 409);
        }
        await tx.boleta.updateMany({
            where: {
                id: {
                    in: selectedBoletas.map((item) => item.id),
                },
            },
            data: {
                estado: 'ASIGNADA',
                rifaVendedorId,
            },
        });
        await tx.rifaVendedor.update({
            where: { id: rifaVendedorId },
            data: {
                saldoActual: {
                    increment: Number(relation.precioCasa) * selectedBoletas.length,
                },
            },
        });
        const asignacion = await tx.asignacionBoletas.create({
            data: {
                rifaVendedorId,
                cantidad: selectedBoletas.length,
                detalle: {
                    create: selectedBoletas.map((item) => ({
                        boletaId: item.id,
                    })),
                },
            },
            include: asignacionInclude,
        });
        return asignacion;
    });
}
async function listDevolucionesByRifaVendedor(id) {
    await getRifaVendedorById(id);
    const rows = await prismaClient().devolucionBoletas.findMany({
        where: {
            rifaVendedorId: id,
        },
        include: devolucionInclude,
        orderBy: {
            fecha: 'desc',
        },
    });
    return rows.map((row) => ({
        ...row,
        accion: row.destino === 'FUERA_CIRCULACION'
            ? `DEVOLUCION DE ${row.rifaVendedor.vendedor?.nombre || 'VENDEDOR'}`
            : 'DEVOLUCION A DISPONIBLES',
        totalTransaccion: Number(row.detalle.length) * Number(row.rifaVendedor.precioCasa),
        rifaVendedor: withTotalAbonado(row.rifaVendedor),
    }));
}
async function createDevolucion(rifaVendedorId, payload) {
    const prisma = prismaClient();
    const relation = await prisma.rifaVendedor.findUnique({
        where: { id: rifaVendedorId },
        include: {
            rifa: {
                select: {
                    id: true,
                    numeroCifras: true,
                },
            },
            vendedor: {
                select: {
                    nombre: true,
                },
            },
        },
    });
    if (!relation) {
        throw new app_error_1.AppError('La relacion rifa-vendedor no existe.', 404);
    }
    return prisma.$transaction(async (tx) => {
        let boletas = [];
        if (payload.metodo === 'TODAS') {
            boletas = await tx.boleta.findMany({
                where: {
                    rifaVendedorId,
                    estado: 'ASIGNADA',
                },
                select: {
                    id: true,
                    numero: true,
                },
                orderBy: {
                    numero: 'asc',
                },
            });
        }
        else {
            const numeros = parseListaNumeros(payload.listaNumeros || '', relation.rifa.numeroCifras);
            const result = await tx.boleta.findMany({
                where: {
                    rifaId: relation.rifaId,
                    numero: {
                        in: numeros,
                    },
                },
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                    rifaVendedorId: true,
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
                orderBy: {
                    numero: 'asc',
                },
            });
            const boletaMap = new Map(result.map((item) => [item.numero, item]));
            const missing = numeros.filter((numero) => !boletaMap.has(numero));
            if (missing.length > 0) {
                throw new app_error_1.AppError(`Las siguientes boletas no existen en la rifa: ${missing.join(', ')}.`, 409);
            }
            const noRetornables = result.filter((item) => item.estado !== 'ASIGNADA' || item.rifaVendedorId !== rifaVendedorId);
            if (noRetornables.length > 0) {
                const retornables = result
                    .filter((item) => item.estado === 'ASIGNADA' && item.rifaVendedorId === rifaVendedorId)
                    .map((item) => item.numero);
                if (!payload.permitirParcial || retornables.length === 0) {
                    throw buildPartialReturnError(`Algunas boletas no se pueden desasignar porque no pertenecen actualmente a este vendedor o no estan en estado ASIGNADA.`, noRetornables, retornables);
                }
            }
            boletas = result
                .filter((item) => item.estado === 'ASIGNADA' && item.rifaVendedorId === rifaVendedorId)
                .map((item) => ({ id: item.id, numero: item.numero }));
        }
        if (boletas.length === 0) {
            throw new app_error_1.AppError('No hay boletas para devolver con los criterios enviados.', 409);
        }
        await Promise.all(boletas.map((item) => tx.boleta.update({
            where: { id: item.id },
            data: {
                estado: payload.destino === 'FUERA_CIRCULACION' ? 'DEVUELTA' : 'DISPONIBLE',
                rifaVendedorId: null,
                juega: false,
                devueltaPorVendedorNombre: payload.destino === 'FUERA_CIRCULACION'
                    ? relation.vendedor?.nombre || null
                    : null,
                devueltaObservacion: payload.destino === 'FUERA_CIRCULACION'
                    ? `Devolucion de ${relation.vendedor?.nombre || 'vendedor'}`
                    : null,
            },
        })));
        await tx.boletaPremio.deleteMany({
            where: {
                boletaId: {
                    in: boletas.map((item) => item.id),
                },
            },
        });
        await tx.rifaVendedor.update({
            where: { id: rifaVendedorId },
            data: {
                saldoActual: {
                    decrement: Number(relation.precioCasa) * boletas.length,
                },
            },
        });
        return tx.devolucionBoletas.create({
            data: {
                rifaVendedorId,
                destino: payload.destino,
                detalle: {
                    create: boletas.map((item) => ({
                        boletaId: item.id,
                    })),
                },
            },
            include: devolucionInclude,
        });
    });
}
