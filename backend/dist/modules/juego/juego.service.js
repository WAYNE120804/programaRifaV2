"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listJuego = listJuego;
exports.actualizarJuegoRifaVendedor = actualizarJuegoRifaVendedor;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const estadosJugables = ['ASIGNADA', 'RESERVADA', 'VENDIDA', 'PAGADA'];
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function normalizeNumero(numero, numeroCifras) {
    return String(numero || '').replace(/\D/g, '').padStart(numeroCifras, '0');
}
async function getPremioConRifa(premioId) {
    const premio = await prismaClient().premio.findUnique({
        where: { id: premioId },
        select: {
            id: true,
            nombre: true,
            descripcion: true,
            fecha: true,
            tipo: true,
            mostrarValor: true,
            valor: true,
            rifaId: true,
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    loteriaNombre: true,
                    numeroCifras: true,
                    precioBoleta: true,
                },
            },
        },
    });
    if (!premio) {
        throw new app_error_1.AppError('El premio seleccionado no existe.', 404);
    }
    return premio;
}
async function listJuego(filters) {
    const prisma = prismaClient();
    const premio = await getPremioConRifa(filters.premioId);
    if (premio.rifaId !== filters.rifaId) {
        throw new app_error_1.AppError('El premio no pertenece a la rifa seleccionada.', 409);
    }
    const relaciones = await prisma.rifaVendedor.findMany({
        where: {
            rifaId: filters.rifaId,
            ...(filters.rifaVendedorId ? { id: filters.rifaVendedorId } : {}),
        },
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
            boletas: {
                where: {
                    premios: {
                        some: {
                            premioId: filters.premioId,
                        },
                    },
                    ...(filters.numero ? { numero: { contains: filters.numero } } : {}),
                },
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                },
                orderBy: {
                    numero: 'asc',
                },
            },
        },
        orderBy: {
            vendedor: {
                nombre: 'asc',
            },
        },
    });
    const grupos = relaciones
        .map((relation) => ({
        rifaVendedorId: relation.id,
        vendedor: relation.vendedor,
        precioCasa: relation.precioCasa,
        totalBoletas: relation.boletas.length,
        boletas: relation.boletas,
    }))
        .filter((relation) => filters.rifaVendedorId ? true : relation.totalBoletas > 0);
    return {
        premio: {
            id: premio.id,
            nombre: premio.nombre,
            descripcion: premio.descripcion,
            fecha: premio.fecha,
            tipo: premio.tipo,
            mostrarValor: premio.mostrarValor,
            valor: premio.valor,
        },
        rifa: premio.rifa,
        totalBoletas: grupos.reduce((sum, item) => sum + item.totalBoletas, 0),
        totalVendedores: grupos.filter((item) => item.totalBoletas > 0).length,
        grupos,
    };
}
async function actualizarJuegoRifaVendedor(rifaVendedorId, payload) {
    const prisma = prismaClient();
    const premio = await getPremioConRifa(payload.premioId);
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
    if (relation.rifaId !== premio.rifaId) {
        throw new app_error_1.AppError('El premio no pertenece a la misma rifa del vendedor.', 409);
    }
    const boletasElegibles = await prisma.boleta.findMany({
        where: {
            rifaVendedorId,
            estado: {
                in: [...estadosJugables],
            },
        },
        select: {
            id: true,
            numero: true,
        },
        orderBy: {
            numero: 'asc',
        },
    });
    const elegiblesMap = new Map(boletasElegibles.map((boleta) => [boleta.numero, boleta]));
    let selectedIds = [];
    if (payload.modo === 'LISTA') {
        const normalized = [...new Set(payload.numeros)].map((numero) => normalizeNumero(numero, relation.rifa.numeroCifras));
        const invalidos = normalized.filter((numero) => !elegiblesMap.has(numero));
        if (invalidos.length > 0) {
            throw new app_error_1.AppError(`Estas boletas no pertenecen actualmente a ${relation.vendedor.nombre} o no estan jugables: ${invalidos.join(', ')}.`, 409);
        }
        selectedIds = normalized
            .map((numero) => elegiblesMap.get(numero)?.id)
            .filter(Boolean);
    }
    else if (payload.modo === 'TODAS') {
        selectedIds = boletasElegibles.map((boleta) => boleta.id);
    }
    await prisma.$transaction(async (tx) => {
        await tx.boletaPremio.deleteMany({
            where: {
                premioId: payload.premioId,
                boleta: {
                    rifaVendedorId,
                },
            },
        });
        if (selectedIds.length > 0) {
            await tx.boletaPremio.createMany({
                data: selectedIds.map((boletaId) => ({
                    premioId: payload.premioId,
                    boletaId,
                })),
                skipDuplicates: true,
            });
        }
    });
    return listJuego({
        rifaId: relation.rifa.id,
        premioId: payload.premioId,
        rifaVendedorId,
    });
}
