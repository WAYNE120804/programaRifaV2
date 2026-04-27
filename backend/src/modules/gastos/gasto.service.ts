import {
  CategoriaGasto,
  EstadoCaja,
  OrigenGasto,
  Prisma,
  TipoCaja,
  TipoMovimientoCaja,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { GastoPayload } from './gasto.schemas';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
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

function mapMoneyFields(gasto: any) {
  return {
    ...gasto,
    valor: Number(gasto.valor || 0),
    saldoOrigenAnterior: Number(gasto.saldoOrigenAnterior || 0),
    saldoOrigenPosterior: Number(gasto.saldoOrigenPosterior || 0),
  };
}

export async function listGastos() {
  const prisma = prismaClient();
  const [gastos, cajaDiaria, cajaGeneral, fondos] = await Promise.all([
    prisma.gasto.findMany({
      where: { anuladoAt: null },
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
            estado: true,
            saldoActual: true,
          },
        },
        fondo: {
          select: {
            id: true,
            nombre: true,
            acumulado: true,
            activo: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    }),
    prisma.$transaction((tx) => findDailyCaja(tx)),
    prisma.$transaction((tx) => findOrCreateGeneralCaja(tx)),
    prisma.fondoMeta.findMany({
      where: { activo: true },
      orderBy: [{ nombre: 'asc' }],
    }),
  ]);

  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);
  const totalPorCategoria = Object.values(CategoriaGasto).map((categoria) => ({
    categoria,
    total: gastos
      .filter((gasto) => gasto.categoria === categoria)
      .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0),
  }));

  return {
    gastos: gastos.map(mapMoneyFields),
    resumen: {
      totalGastos,
      totalRegistros: gastos.length,
      totalPorCategoria,
    },
    origenes: Object.values(OrigenGasto),
    categorias: Object.values(CategoriaGasto),
    cajas: {
      CAJA_DIARIA: cajaDiaria
        ? {
            id: cajaDiaria.id,
            nombre: cajaDiaria.nombre,
            estado: cajaDiaria.estado,
            saldoActual: Number(cajaDiaria.saldoActual || 0),
          }
        : null,
      CAJA_GENERAL: cajaGeneral
        ? {
            id: cajaGeneral.id,
            nombre: cajaGeneral.nombre,
            estado: cajaGeneral.estado,
            saldoActual: Number(cajaGeneral.saldoActual || 0),
          }
        : null,
    },
    fondos: fondos.map((fondo) => ({
      ...fondo,
      acumulado: Number(fondo.acumulado || 0),
      metaTotal: Number(fondo.metaTotal || 0),
    })),
  };
}

export async function getGastoById(id: string) {
  const gasto = await prismaClient().gasto.findUnique({
    where: { id },
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
          estado: true,
          saldoActual: true,
        },
      },
      fondo: {
        select: {
          id: true,
          nombre: true,
          acumulado: true,
          activo: true,
        },
      },
      movimientosCaja: {
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  });

  if (!gasto || gasto.anuladoAt) {
    throw new AppError('El gasto no existe.', 404);
  }

  return mapMoneyFields(gasto);
}

export async function registrarGasto(payload: GastoPayload, usuarioId?: string) {
  const prisma = prismaClient();

  await prisma.$transaction(async (tx) => {
    if (payload.origen === OrigenGasto.FONDO_META) {
      const fondo = await tx.fondoMeta.findUnique({ where: { id: payload.fondoId || '' } });

      if (!fondo) {
        throw new AppError('El fondo/meta seleccionado no existe.', 404);
      }

      if (!fondo.activo) {
        throw new AppError('El fondo/meta seleccionado esta inactivo.', 409);
      }

      const saldoAnterior = Number(fondo.acumulado || 0);

      if (saldoAnterior < payload.valor) {
        throw new AppError('El fondo/meta no tiene saldo suficiente para este pago.', 409);
      }

      const saldoPosterior = saldoAnterior - payload.valor;

      await tx.gasto.create({
        data: {
          usuarioId,
          fondoId: fondo.id,
          origen: payload.origen,
          categoria: payload.categoria,
          descripcion: payload.descripcion,
          valor: payload.valor,
          saldoOrigenAnterior: saldoAnterior,
          saldoOrigenPosterior: saldoPosterior,
          soporte: payload.soporte,
          observacion: payload.observacion,
        },
      });

      await tx.fondoMeta.update({
        where: { id: fondo.id },
        data: { acumulado: saldoPosterior },
      });

      return;
    }

    const caja =
      payload.origen === OrigenGasto.CAJA_GENERAL
        ? await findOrCreateGeneralCaja(tx)
        : await findDailyCaja(tx);

    if (!caja) {
      throw new AppError('No hay una caja diaria disponible para registrar el pago.', 404);
    }

    if (payload.origen === OrigenGasto.CAJA_DIARIA && caja.estado !== EstadoCaja.ABIERTA) {
      throw new AppError('La caja diaria debe estar abierta para registrar pagos.', 409);
    }

    const saldoAnterior = Number(caja.saldoActual || 0);

    if (saldoAnterior < payload.valor) {
      throw new AppError('El origen seleccionado no tiene saldo suficiente para este pago.', 409);
    }

    const saldoPosterior = saldoAnterior - payload.valor;

    const gasto = await tx.gasto.create({
      data: {
        usuarioId,
        cajaId: caja.id,
        origen: payload.origen,
        categoria: payload.categoria,
        descripcion: payload.descripcion,
        valor: payload.valor,
        saldoOrigenAnterior: saldoAnterior,
        saldoOrigenPosterior: saldoPosterior,
        soporte: payload.soporte,
        observacion: payload.observacion,
      },
    });

    await tx.caja.update({
      where: { id: caja.id },
      data: { saldoActual: saldoPosterior },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        usuarioId,
        gastoId: gasto.id,
        tipo: TipoMovimientoCaja.EGRESO,
        valor: payload.valor,
        saldoAnterior,
        saldoPosterior,
        descripcion: `${payload.categoria}: ${payload.descripcion}`,
        referenciaTipo: 'GASTO',
        referenciaId: gasto.id,
      },
    });
  });

  return listGastos();
}
