"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateGenericClient = getOrCreateGenericClient;
exports.listClientes = listClientes;
exports.getClienteById = getClienteById;
exports.createCliente = createCliente;
exports.updateCliente = updateCliente;
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const GENERIC_CUSTOMER_DOCUMENT = '2222222';
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
async function getOrCreateGenericClient() {
    const prisma = prismaClient();
    const existing = await prisma.cliente.findUnique({
        where: { cedula: GENERIC_CUSTOMER_DOCUMENT },
    });
    if (existing) {
        return existing;
    }
    return prisma.cliente.create({
        data: {
            nombreCompleto: 'CLIENTE GENERAL',
            cedula: GENERIC_CUSTOMER_DOCUMENT,
            telefonoCelular: GENERIC_CUSTOMER_DOCUMENT,
            email: null,
            fechaNacimiento: null,
            observaciones: 'Cliente generico para ventas de mostrador sin datos completos.',
            createdById: null,
        },
    });
}
async function listClientes(filters) {
    const search = filters?.search?.trim();
    return prismaClient().cliente.findMany({
        where: {
            ...(search
                ? {
                    OR: [
                        { nombreCompleto: { contains: search, mode: 'insensitive' } },
                        { cedula: { contains: search, mode: 'insensitive' } },
                        { telefonoCelular: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        },
        orderBy: [{ nombreCompleto: 'asc' }],
    });
}
async function getClienteById(id) {
    const cliente = await prismaClient().cliente.findUnique({
        where: { id },
    });
    if (!cliente) {
        throw new app_error_1.AppError('El cliente no existe.', 404);
    }
    return cliente;
}
async function createCliente(payload, usuarioId) {
    const prisma = prismaClient();
    const duplicateCedula = await prisma.cliente.findUnique({
        where: { cedula: payload.cedula },
        select: { id: true },
    });
    if (duplicateCedula) {
        throw new app_error_1.AppError('Ya existe un cliente con esa cedula.', 409);
    }
    return prisma.cliente.create({
        data: {
            nombreCompleto: payload.nombreCompleto,
            cedula: payload.cedula,
            telefonoCelular: payload.telefonoCelular,
            email: payload.email,
            fechaNacimiento: payload.fechaNacimiento,
            observaciones: payload.observaciones,
            createdById: usuarioId || null,
        },
    });
}
async function updateCliente(id, payload) {
    const prisma = prismaClient();
    await getClienteById(id);
    const duplicateCedula = await prisma.cliente.findFirst({
        where: {
            cedula: payload.cedula,
            NOT: { id },
        },
        select: { id: true },
    });
    if (duplicateCedula) {
        throw new app_error_1.AppError('Ya existe otro cliente con esa cedula.', 409);
    }
    return prisma.cliente.update({
        where: { id },
        data: {
            nombreCompleto: payload.nombreCompleto,
            cedula: payload.cedula,
            telefonoCelular: payload.telefonoCelular,
            email: payload.email,
            fechaNacimiento: payload.fechaNacimiento,
            observaciones: payload.observaciones,
        },
    });
}
