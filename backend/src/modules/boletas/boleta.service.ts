import { EstadoBoleta, Prisma } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type {
  BoletaListFilters,
  UpdateBoletaPayload,
} from './boleta.schemas';

const boletaInclude = {
  rifa: {
    select: {
      id: true,
      nombre: true,
      numeroCifras: true,
      precioBoleta: true,
      estado: true,
    },
  },
  rifaVendedor: {
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
    },
  },
} satisfies Prisma.BoletaInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

export async function listBoletas(filters: BoletaListFilters) {
  const vendedorNombre = filters.vendedorNombre?.trim();

  return prismaClient().boleta.findMany({
    where: {
      ...(filters.rifaId ? { rifaId: filters.rifaId } : {}),
      ...(filters.rifaVendedorId ? { rifaVendedorId: filters.rifaVendedorId } : {}),
      ...(filters.estado ? { estado: filters.estado } : {}),
      ...(filters.numero ? { numero: { contains: filters.numero } } : {}),
      ...(typeof filters.juega === 'boolean' ? { juega: filters.juega } : {}),
      ...(vendedorNombre
        ? {
            OR: [
              {
                rifaVendedor: {
                  vendedor: {
                    nombre: {
                      contains: vendedorNombre,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                devueltaPorVendedorNombre: {
                  contains: vendedorNombre,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },
    include: boletaInclude,
    orderBy: [{ numero: 'asc' }],
  });
}

export async function getBoletaById(id: string) {
  const boleta = await prismaClient().boleta.findUnique({
    where: { id },
    include: boletaInclude,
  });

  if (!boleta) {
    throw new AppError('La boleta no existe.', 404);
  }

  return boleta;
}

export async function updateBoleta(id: string, payload: UpdateBoletaPayload) {
  const prisma = prismaClient();
  const boleta = await getBoletaById(id);

  if (payload.estado === EstadoBoleta.DISPONIBLE) {
    return prisma.$transaction(async (tx) => {
      await tx.boletaPremio.deleteMany({
        where: {
          boletaId: id,
        },
      });

      return tx.boleta.update({
        where: { id },
        data: {
          estado: EstadoBoleta.DISPONIBLE,
          rifaVendedorId: null,
          juega: false,
          devueltaPorVendedorNombre: null,
          devueltaObservacion: null,
        },
        include: boletaInclude,
      });
    });
  }

  if (payload.estado === EstadoBoleta.ASIGNADA && !payload.rifaVendedorId) {
    throw new AppError(
      'Para marcar una boleta como asignada debes seleccionar un vendedor.',
      409
    );
  }

  if (payload.rifaVendedorId) {
    const relation = await prisma.rifaVendedor.findUnique({
      where: { id: payload.rifaVendedorId },
      select: {
        id: true,
        rifaId: true,
      },
    });

    if (!relation) {
      throw new AppError('La relacion rifa-vendedor seleccionada no existe.', 404);
    }

    if (relation.rifaId !== boleta.rifaId) {
      throw new AppError(
        'La boleta solo se puede asignar a vendedores vinculados a la misma rifa.',
        409
      );
    }
  }

  const requiresClearPremios =
    payload.estado === EstadoBoleta.DEVUELTA ||
    payload.estado === EstadoBoleta.ANULADA ||
    payload.rifaVendedorId !== boleta.rifaVendedorId;

  return prisma.$transaction(async (tx) => {
    if (requiresClearPremios) {
      await tx.boletaPremio.deleteMany({
        where: {
          boletaId: id,
        },
      });
    }

    return tx.boleta.update({
      where: { id },
      data: {
        estado: payload.estado,
        rifaVendedorId: payload.rifaVendedorId,
        ...(requiresClearPremios
          ? {
              juega: false,
            }
          : {}),
        ...(payload.estado !== EstadoBoleta.DEVUELTA
          ? {
              devueltaPorVendedorNombre: null,
              devueltaObservacion: null,
            }
          : {}),
      },
      include: boletaInclude,
    });
  });
}
