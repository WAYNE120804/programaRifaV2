import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { ClientePayload } from './cliente.schemas';

const GENERIC_CUSTOMER_DOCUMENT = '2222222';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

export async function getOrCreateGenericClient() {
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
    } as any,
  });
}

export async function listClientes(filters?: { search?: string }) {
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

export async function getClienteById(id: string) {
  const cliente = await prismaClient().cliente.findUnique({
    where: { id },
  });

  if (!cliente) {
    throw new AppError('El cliente no existe.', 404);
  }

  return cliente;
}

export async function createCliente(payload: ClientePayload, usuarioId?: string) {
  const prisma = prismaClient();

  const duplicateCedula = await prisma.cliente.findUnique({
    where: { cedula: payload.cedula },
    select: { id: true },
  });

  if (duplicateCedula) {
    throw new AppError('Ya existe un cliente con esa cedula.', 409);
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
    } as any,
  });
}

export async function updateCliente(id: string, payload: ClientePayload) {
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
    throw new AppError('Ya existe otro cliente con esa cedula.', 409);
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
    } as any,
  });
}
