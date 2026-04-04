import { CategoriaGasto, Prisma } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';

import type { AnularGastoPayload, CreateGastoPayload } from './gasto.schemas';

const gastoInclude = {
  usuario: {
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
    },
  },
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
} satisfies Prisma.GastoInclude;

const gastoReciboInclude = {
  gasto: {
    include: gastoInclude,
  },
} satisfies Prisma.GastoReciboInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function normalizeSegment(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8);
}

function extractRifaSegment(rifaNombre: string) {
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

function extractValorSegment(valor: number) {
  return String(Math.round(valor)).padStart(4, '0');
}

function buildCodigoUnico(input: {
  rifaNombre: string;
  consecutivo: number;
  valor: number;
}) {
  const rifaSegment = extractRifaSegment(input.rifaNombre);
  const consecutivoSegment = String(input.consecutivo).padStart(6, '0');
  const valorSegment = extractValorSegment(input.valor);

  return `GST-${rifaSegment}-${consecutivoSegment}-${valorSegment}`;
}

export async function listGastos(filters?: {
  rifaId?: string;
  categoria?: string;
  usuarioId?: string;
}) {
  return prismaClient().gasto.findMany({
    where: {
      ...(filters?.rifaId ? { rifaId: filters.rifaId } : {}),
      ...(filters?.categoria ? { categoria: filters.categoria as CategoriaGasto } : {}),
      ...(filters?.usuarioId ? { usuarioId: filters.usuarioId } : {}),
    },
    include: gastoInclude,
    orderBy: {
      fecha: 'desc',
    },
  });
}

export async function getGastoById(id: string) {
  const gasto = await prismaClient().gasto.findUnique({
    where: { id },
    include: gastoInclude,
  });

  if (!gasto) {
    throw new AppError('El gasto no existe.', 404);
  }

  return gasto;
}

export async function createGasto(payload: CreateGastoPayload, usuarioId?: string) {
  const prisma = prismaClient();
  const rifa = await prisma.rifa.findUnique({
    where: { id: payload.rifaId },
    select: {
      id: true,
      nombre: true,
    },
  });

  if (!rifa) {
    throw new AppError('La rifa seleccionada no existe.', 404);
  }

  let subCaja:
    | {
        id: string;
        nombre: string;
        caja: {
          id: string;
          rifaId: string;
        };
      }
    | null = null;

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
      throw new AppError('La subcaja seleccionada no existe.', 404);
    }

    if (subCaja.caja.rifaId !== payload.rifaId) {
      throw new AppError('La subcaja seleccionada no pertenece a la rifa del gasto.', 409);
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
        usuarioId,
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
          usuarioId,
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

export async function getGastoReciboById(id: string) {
  const recibo = await prismaClient().gastoRecibo.findUnique({
    where: { id },
    include: gastoReciboInclude,
  });

  if (!recibo) {
    throw new AppError('El recibo de gasto no existe.', 404);
  }

  return recibo;
}

export async function getGastoReciboByCodigo(codigo: string) {
  const recibo = await prismaClient().gastoRecibo.findUnique({
    where: { codigoUnico: codigo },
    include: gastoReciboInclude,
  });

  if (!recibo) {
    throw new AppError('No existe un recibo de gasto con ese codigo.', 404);
  }

  return recibo;
}

export async function anularGasto(
  gastoId: string,
  payload: AnularGastoPayload,
  usuarioId?: string
) {
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
  })) as Prisma.GastoGetPayload<{
    include: {
      subCaja: {
        include: {
          caja: {
            select: {
              id: true;
            };
          };
        };
      };
    };
  }> | null;

  if (!gasto) {
    throw new AppError('El gasto no existe.', 404);
  }

  if (gasto.anuladoAt) {
    throw new AppError('El gasto ya fue anulado.', 409);
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
          usuarioId,
        },
      });
    }

    const updateData: Prisma.GastoUpdateInput = {
      anuladoAt: new Date(),
      anuladoMotivo: payload.motivo,
    };

    await tx.gasto.update({
      where: { id: gasto.id },
      data: updateData,
    });
  });
}
