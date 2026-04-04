import { Prisma } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { RifaPayload } from './rifa.schemas';

const rifaListSelect = {
  id: true,
  nombre: true,
  loteriaNombre: true,
  numeroCifras: true,
  fechaInicio: true,
  fechaFin: true,
  precioBoleta: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      vendedores: true,
      boletas: true,
      premios: true,
    },
  },
} as Prisma.RifaSelect;

const rifaDetailInclude = {
  vendedores: {
    select: {
      id: true,
      comisionPct: true,
      precioCasa: true,
      saldoActual: true,
      vendedor: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          documento: true,
        },
      },
    },
    orderBy: {
      vendedor: {
        nombre: 'asc',
      },
    },
  },
  cajas: {
    select: {
      id: true,
      nombre: true,
      saldo: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  },
  premios: {
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      imagenesJson: true,
      tipo: true,
      mostrarValor: true,
      valor: true,
      fecha: true,
      _count: {
        select: {
          boletas: true,
        },
      },
    },
    orderBy: [{ fecha: 'asc' }, { nombre: 'asc' }],
  },
  _count: {
    select: {
      vendedores: true,
      boletas: true,
      premios: true,
      gastos: true,
      ventas: true,
    },
  },
} as Prisma.RifaInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function buildBoletas(rifaId: string, numeroCifras: number, precioBoleta: number) {
  const total = 10 ** numeroCifras;
  const boletas = [];

  for (let index = 0; index < total; index += 1) {
    boletas.push({
      rifaId,
      numero: String(index).padStart(numeroCifras, '0'),
      precio: precioBoleta,
    });
  }

  return boletas;
}

export async function listRifas() {
  return prismaClient().rifa.findMany({
    select: rifaListSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getRifaById(id: string) {
  const rifa = await prismaClient().rifa.findUnique({
    where: { id },
    include: rifaDetailInclude,
  });

  if (!rifa) {
    throw new AppError('Rifa no encontrada.', 404);
  }

  return rifa;
}

export async function createRifa(payload: RifaPayload) {
  const prisma = prismaClient();

  return prisma.$transaction(async (tx) => {
    const rifa = await tx.rifa.create({
      data: payload,
      include: rifaDetailInclude,
    });

    const boletas = buildBoletas(
      rifa.id,
      payload.numeroCifras,
      payload.precioBoleta
    );

    await tx.boleta.createMany({
      data: boletas,
    });

    await tx.caja.create({
      data: {
        nombre: 'Caja principal',
        saldo: 0,
        rifaId: rifa.id,
      },
    });

    return tx.rifa.findUniqueOrThrow({
      where: { id: rifa.id },
      include: rifaDetailInclude,
    });
  });
}

export async function updateRifa(id: string, payload: RifaPayload) {
  const existing = await getRifaById(id);

  if (
    existing.numeroCifras !== payload.numeroCifras &&
    existing._count.boletas > 0
  ) {
    throw new AppError(
      'No se puede cambiar el numero de cifras porque la rifa ya tiene boletas generadas.',
      409
    );
  }

  return prismaClient().rifa.update({
    where: { id },
    data: payload,
    include: rifaDetailInclude,
  });
}

export async function deleteRifa(id: string) {
  const prisma = prismaClient();
  const rifa = await getRifaById(id);

  if (rifa._count.boletas > 0 || rifa._count.vendedores > 0 || rifa._count.ventas > 0) {
    throw new AppError(
      'La rifa no se puede eliminar porque ya tiene boletas, vendedores o ventas asociadas.',
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.caja.deleteMany({
      where: { rifaId: id },
    });

    await tx.rifa.delete({
      where: { id },
    });
  });
}
