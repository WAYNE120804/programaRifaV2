import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { ActualizarJuegoPayload, JuegoListFilters } from './juego.schemas';

const estadosJugables = ['ASIGNADA', 'RESERVADA', 'VENDIDA', 'PAGADA'] as const;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function normalizeNumero(numero: string, numeroCifras: number) {
  return String(numero || '').replace(/\D/g, '').padStart(numeroCifras, '0');
}

async function getPremioConRifa(premioId: string) {
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
    throw new AppError('El premio seleccionado no existe.', 404);
  }

  return premio;
}

export async function listJuego(filters: JuegoListFilters) {
  const prisma = prismaClient();
  const premio = await getPremioConRifa(filters.premioId);

  if (premio.rifaId !== filters.rifaId) {
    throw new AppError('El premio no pertenece a la rifa seleccionada.', 409);
  }

  const [relaciones, registros] = await Promise.all([
    prisma.rifaVendedor.findMany({
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
    }),
    prisma.juegoRegistro.findMany({
      where: {
        premioId: filters.premioId,
        rifaVendedor: {
          rifaId: filters.rifaId,
          ...(filters.rifaVendedorId ? { id: filters.rifaVendedorId } : {}),
        },
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    }),
  ]);

  const registroMap = new Map(registros.map((item) => [item.rifaVendedorId, item]));

  const grupos = relaciones
    .map((relation) => ({
      rifaVendedorId: relation.id,
      vendedor: relation.vendedor,
      precioCasa: relation.precioCasa,
      totalBoletas: relation.boletas.length,
      boletas: relation.boletas,
      registro: registroMap.get(relation.id) || null,
    }))
    .filter((relation) =>
      filters.rifaVendedorId ? true : relation.totalBoletas > 0
    );

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

export async function actualizarJuegoRifaVendedor(
  rifaVendedorId: string,
  payload: ActualizarJuegoPayload,
  usuarioId?: string
) {
  const prisma = prismaClient();
  const premio = await getPremioConRifa(payload.premioId);

  const relation = await prisma.rifaVendedor.findUnique({
    where: {
      id: rifaVendedorId,
    },
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
    throw new AppError('La relacion rifa-vendedor no existe.', 404);
  }

  if (relation.rifaId !== premio.rifaId) {
    throw new AppError('El premio no pertenece a la misma rifa del vendedor.', 409);
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

  const elegiblesMap = new Map(
    boletasElegibles.map((boleta) => [boleta.numero, boleta])
  );

  let selectedIds: string[] = [];

  if (payload.modo === 'LISTA') {
    const normalized = [...new Set(payload.numeros)].map((numero) =>
      normalizeNumero(numero, relation.rifa.numeroCifras)
    );

    const invalidos = normalized.filter((numero) => !elegiblesMap.has(numero));

    if (invalidos.length > 0) {
      throw new AppError(
        `Estas boletas no pertenecen actualmente a ${relation.vendedor.nombre} o no estan jugables: ${invalidos.join(', ')}.`,
        409
      );
    }

    selectedIds = normalized
      .map((numero) => elegiblesMap.get(numero)?.id)
      .filter(Boolean) as string[];
  } else if (payload.modo === 'TODAS') {
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

      await tx.juegoRegistro.upsert({
        where: {
          rifaVendedorId_premioId: {
            rifaVendedorId,
            premioId: payload.premioId,
          },
        },
        update: {
          usuarioId,
          fecha: new Date(),
          totalBoletas: selectedIds.length,
        },
        create: {
          rifaVendedorId,
          premioId: payload.premioId,
          usuarioId,
          fecha: new Date(),
          totalBoletas: selectedIds.length,
        },
      });
    });

  return listJuego({
    rifaId: relation.rifa.id,
    premioId: payload.premioId,
    rifaVendedorId,
  });
}
