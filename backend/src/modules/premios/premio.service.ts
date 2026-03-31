import { Prisma } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { PremioBoletasPayload, PremioPayload } from './premio.schemas';

const premioInclude = {
  rifa: {
    select: {
      id: true,
      nombre: true,
      loteriaNombre: true,
      numeroCifras: true,
    },
  },
  boletas: {
    select: {
      boleta: {
        select: {
          id: true,
          numero: true,
          estado: true,
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
      },
    },
    orderBy: {
      boleta: {
        numero: 'asc',
      },
    },
  },
} as Prisma.PremioInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function normalizeNumero(value: string, numeroCifras: number) {
  const numericValue = Number(value);
  const maxValue = 10 ** numeroCifras - 1;

  if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > maxValue) {
    throw new AppError(
      `El numero "${value}" esta fuera del rango permitido para ${numeroCifras} cifras.`
    );
  }

  return String(numericValue).padStart(numeroCifras, '0');
}

export async function listPremiosByRifa(rifaId: string) {
  return prismaClient().premio.findMany({
    where: { rifaId },
    include: premioInclude,
    orderBy: [{ fecha: 'asc' }, { nombre: 'asc' }],
  });
}

export async function getPremioById(id: string) {
  const premio = await prismaClient().premio.findUnique({
    where: { id },
    include: premioInclude,
  });

  if (!premio) {
    throw new AppError('El premio no existe.', 404);
  }

  return premio;
}

export async function createPremio(payload: PremioPayload) {
  const prisma = prismaClient();
  const rifa = await prisma.rifa.findUnique({
    where: { id: payload.rifaId },
    select: { id: true },
  });

  if (!rifa) {
    throw new AppError('La rifa seleccionada no existe.', 404);
  }

  return prisma.premio.create({
    data: payload,
    include: premioInclude,
  });
}

export async function updatePremio(id: string, payload: PremioPayload) {
  await getPremioById(id);

  return prismaClient().premio.update({
    where: { id },
    data: payload,
    include: premioInclude,
  });
}

export async function deletePremio(id: string) {
  const prisma = prismaClient();
  await getPremioById(id);

  await prisma.$transaction(async (tx) => {
    await tx.boletaPremio.deleteMany({
      where: { premioId: id },
    });

    await tx.premio.delete({
      where: { id },
    });
  });
}

export async function updatePremioBoletas(id: string, payload: PremioBoletasPayload) {
  const prisma = prismaClient();
  const premio = await getPremioById(id);
  const numeros = payload.numeros.map((numero) =>
    normalizeNumero(numero, premio.rifa.numeroCifras)
  );

  const boletas = numeros.length
    ? await prisma.boleta.findMany({
        where: {
          rifaId: premio.rifaId,
          numero: {
            in: numeros,
          },
        },
        select: {
          id: true,
          numero: true,
        },
      })
    : [];

  const missingNumbers = numeros.filter(
    (numero) => !boletas.some((boleta) => boleta.numero === numero)
  );

  if (missingNumbers.length > 0) {
    throw new AppError(
      `Las siguientes boletas no existen en la rifa: ${missingNumbers.join(', ')}.`,
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.boletaPremio.deleteMany({
      where: { premioId: id },
    });

    if (boletas.length) {
      await tx.boletaPremio.createMany({
        data: boletas.map((boleta) => ({
          premioId: id,
          boletaId: boleta.id,
        })),
      });
    }
  });

  return getPremioById(id);
}
