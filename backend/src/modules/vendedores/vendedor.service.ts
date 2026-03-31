import { Prisma } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { VendedorPayload } from './vendedor.schemas';

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
} satisfies Prisma.VendedorSelect;

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
} satisfies Prisma.VendedorInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

export async function listVendedores() {
  return prismaClient().vendedor.findMany({
    select: vendedorListSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getVendedorById(id: string) {
  const vendedor = await prismaClient().vendedor.findUnique({
    where: { id },
    include: vendedorDetailInclude,
  });

  if (!vendedor) {
    throw new AppError('Vendedor no encontrado.', 404);
  }

  return vendedor;
}

export async function createVendedor(payload: VendedorPayload) {
  return prismaClient().vendedor.create({
    data: payload,
    include: vendedorDetailInclude,
  });
}

export async function updateVendedor(id: string, payload: VendedorPayload) {
  await getVendedorById(id);

  return prismaClient().vendedor.update({
    where: { id },
    data: payload,
    include: vendedorDetailInclude,
  });
}

export async function deleteVendedor(id: string) {
  const prisma = prismaClient();
  const vendedor = await getVendedorById(id);

  if (vendedor._count.rifas > 0 || vendedor._count.movimientos > 0) {
    throw new AppError(
      'El vendedor no se puede eliminar porque ya tiene rifas o movimientos asociados.',
      409
    );
  }

  await prisma.vendedor.delete({
    where: { id },
  });
}
