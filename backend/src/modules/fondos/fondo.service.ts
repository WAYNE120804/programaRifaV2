import {
  EstadoCaja,
  OrigenApartadoFondo,
  Prisma,
  TipoCaja,
  TipoMovimientoCaja,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { ApartadoFondoPayload, DeleteFondoPayload, UpsertFondoPayload } from './fondo.schemas';

const DEFAULT_FONDOS = ['arriendo', 'nomina', 'servicios', 'ahorro', 'compras'];

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateRange(dateKey = formatDateKey()) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return { start, end };
}

async function ensureDefaultFondos(tx: Prisma.TransactionClient) {
  const existingCount = await tx.fondoMeta.count();

  if (existingCount > 0) {
    return;
  }

  for (const nombre of DEFAULT_FONDOS) {
    await tx.fondoMeta.upsert({
      where: { nombre },
      update: {},
      create: {
        nombre,
        metaTotal: 0,
        acumulado: 0,
        notas: null,
        activo: true,
      },
    });
  }
}

async function findDailyCaja(tx: Prisma.TransactionClient) {
  const { start, end } = getDateRange();

  return tx.caja.findFirst({
    where: {
      tipo: TipoCaja.DIARIA,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });
}

async function findOrCreateGeneralCaja(tx: Prisma.TransactionClient) {
  const existing = await tx.caja.findFirst({
    where: { tipo: TipoCaja.MAYOR },
    orderBy: [{ createdAt: 'asc' }],
  });

  if (existing) {
    return existing;
  }

  const caja = await tx.caja.create({
    data: {
      nombre: 'Caja general',
      tipo: TipoCaja.MAYOR,
      estado: EstadoCaja.ABIERTA,
      saldoActual: 0,
      descripcion: 'Caja general para consolidar dinero fuera de la operacion diaria.',
      permiteVenta: false,
    },
  });

  await tx.movimientoCaja.create({
    data: {
      cajaId: caja.id,
      tipo: TipoMovimientoCaja.APERTURA,
      valor: 0,
      saldoAnterior: 0,
      saldoPosterior: 0,
      descripcion: 'Creacion de caja general',
      referenciaTipo: 'CAJA',
      referenciaId: caja.id,
    },
  });

  return caja;
}

function mapFondo(fondo: any) {
  const metaTotal = Number(fondo.metaTotal || 0);
  const acumulado = Number(fondo.acumulado || 0);

  return {
    ...fondo,
    metaTotal,
    acumulado,
    faltante: Math.max(metaTotal - acumulado, 0),
    progreso: metaTotal > 0 ? Math.min((acumulado / metaTotal) * 100, 100) : 0,
  };
}

export async function listFondos() {
  const prisma = prismaClient();

  const [fondos, cajaGeneral, cajaDiaria] = await Promise.all([
    prisma.fondoMeta.findMany({
    include: {
      apartados: {
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          caja: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
      },
    },
    orderBy: [{ nombre: 'asc' }],
    }),
    prisma.$transaction((tx) => findOrCreateGeneralCaja(tx)),
    prisma.$transaction((tx) => findDailyCaja(tx)),
  ]);

  const historial = await prisma.fondoApartado.findMany({
    include: {
      fondo: {
        select: {
          id: true,
          nombre: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
        },
      },
      caja: {
        select: {
          id: true,
          nombre: true,
          tipo: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
  });

  return {
    fondos: fondos.map(mapFondo),
    historial,
    origenes: Object.values(OrigenApartadoFondo),
    cajas: {
      CAJA_GENERAL: cajaGeneral
        ? {
            id: cajaGeneral.id,
            nombre: cajaGeneral.nombre,
            saldoActual: Number(cajaGeneral.saldoActual || 0),
            estado: cajaGeneral.estado,
          }
        : null,
      CAJA_DIARIA: cajaDiaria
        ? {
            id: cajaDiaria.id,
            nombre: cajaDiaria.nombre,
            saldoActual: Number(cajaDiaria.saldoActual || 0),
            estado: cajaDiaria.estado,
          }
        : null,
    },
  };
}

export async function upsertFondo(payload: UpsertFondoPayload) {
  const prisma = prismaClient();
  const nombre = normalizeName(payload.nombre);

  await prisma.fondoMeta.upsert({
    where: { nombre },
    update: {
      metaTotal: payload.metaTotal,
      notas: payload.notas,
      activo: payload.activo,
    },
    create: {
      nombre,
      metaTotal: payload.metaTotal,
      acumulado: 0,
      notas: payload.notas,
      activo: payload.activo,
    },
  });

  return listFondos();
}

export async function updateFondo(id: string, payload: UpsertFondoPayload) {
  const prisma = prismaClient();
  const nombre = normalizeName(payload.nombre);
  const existing = await prisma.fondoMeta.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('El fondo seleccionado no existe.', 404);
  }

  const sameName = await prisma.fondoMeta.findUnique({ where: { nombre } });

  if (sameName && sameName.id !== id) {
    throw new AppError('Ya existe otro fondo con ese nombre.', 409);
  }

  await prisma.fondoMeta.update({
    where: { id },
    data: {
      nombre,
      metaTotal: payload.metaTotal,
      notas: payload.notas,
      activo: payload.activo,
    },
  });

  return listFondos();
}

export async function deleteFondo(id: string, payload: DeleteFondoPayload, usuarioId?: string) {
  const prisma = prismaClient();

  await prisma.$transaction(async (tx) => {
    const fondo = await tx.fondoMeta.findUnique({ where: { id } });

    if (!fondo) {
      throw new AppError('El fondo seleccionado no existe.', 404);
    }

    const acumulado = Number(fondo.acumulado || 0);

    if (acumulado > 0 && !payload.destino) {
      throw new AppError('Debes seleccionar la caja destino para redirigir el dinero acumulado.', 409);
    }

    if (acumulado > 0) {
      const caja =
        payload.destino === OrigenApartadoFondo.CAJA_GENERAL
          ? await findOrCreateGeneralCaja(tx)
          : await findDailyCaja(tx);

      if (!caja) {
        throw new AppError('No hay una caja diaria disponible para redirigir el dinero.', 404);
      }

      if (payload.destino === OrigenApartadoFondo.CAJA_DIARIA && caja.estado !== EstadoCaja.ABIERTA) {
        throw new AppError('La caja diaria debe estar abierta para redirigir el dinero.', 409);
      }

      const saldoCajaAnterior = Number(caja.saldoActual || 0);
      const saldoCajaPosterior = saldoCajaAnterior + acumulado;

      await tx.caja.update({
        where: { id: caja.id },
        data: { saldoActual: saldoCajaPosterior },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          usuarioId,
          tipo: TipoMovimientoCaja.INGRESO,
          valor: acumulado,
          saldoAnterior: saldoCajaAnterior,
          saldoPosterior: saldoCajaPosterior,
          descripcion: `Redireccion de fondo eliminado ${fondo.nombre}`,
          referenciaTipo: 'FONDO_META_ELIMINADA',
          referenciaId: fondo.id,
        },
      });
    }

    await tx.fondoMeta.delete({ where: { id: fondo.id } });
  });

  return listFondos();
}

export async function registrarApartadoFondo(payload: ApartadoFondoPayload, usuarioId?: string) {
  const prisma = prismaClient();

  await prisma.$transaction(async (tx) => {
    const fondo = await tx.fondoMeta.findUnique({
      where: { id: payload.fondoId },
    });

    if (!fondo) {
      throw new AppError('El fondo seleccionado no existe.', 404);
    }

    if (!fondo.activo) {
      throw new AppError('El fondo seleccionado esta inactivo.', 409);
    }

    const caja =
      payload.origen === OrigenApartadoFondo.CAJA_GENERAL
        ? await findOrCreateGeneralCaja(tx)
        : await findDailyCaja(tx);

    if (!caja) {
      throw new AppError('No hay una caja diaria disponible para registrar el apartado.', 404);
    }

    if (payload.origen === OrigenApartadoFondo.CAJA_DIARIA && caja.estado !== EstadoCaja.ABIERTA) {
      throw new AppError('La caja diaria debe estar abierta para registrar el apartado.', 409);
    }

    const saldoCajaAnterior = Number(caja.saldoActual || 0);

    if (saldoCajaAnterior < payload.valor) {
      throw new AppError('La caja seleccionada no tiene saldo suficiente para este apartado.', 409);
    }

    const saldoCajaPosterior = saldoCajaAnterior - payload.valor;
    const saldoFondoAnterior = Number(fondo.acumulado || 0);
    const saldoFondoPosterior = saldoFondoAnterior + payload.valor;

    const apartado = await tx.fondoApartado.create({
      data: {
        fondoId: fondo.id,
        usuarioId,
        cajaId: caja.id,
        origen: payload.origen,
        valor: payload.valor,
        saldoFondoAnterior,
        saldoFondoPosterior,
        saldoCajaAnterior,
        saldoCajaPosterior,
        observacion: payload.observacion,
      },
    });

    await tx.fondoMeta.update({
      where: { id: fondo.id },
      data: { acumulado: saldoFondoPosterior },
    });

    await tx.caja.update({
      where: { id: caja.id },
      data: { saldoActual: saldoCajaPosterior },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        usuarioId,
        tipo: TipoMovimientoCaja.EGRESO,
        valor: payload.valor,
        saldoAnterior: saldoCajaAnterior,
        saldoPosterior: saldoCajaPosterior,
        descripcion: `Apartado para fondo ${fondo.nombre}`,
        referenciaTipo: 'FONDO_APARTADO',
        referenciaId: apartado.id,
      },
    });
  });

  return listFondos();
}
