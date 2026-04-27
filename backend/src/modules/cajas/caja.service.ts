import {
  EstadoCaja,
  EstadoPagoVenta,
  EstadoVenta,
  MetodoPago,
  Prisma,
  TipoCaja,
  TipoMovimientoCaja,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type {
  AperturaCajaPayload,
  CierreCajaPayload,
  SalidaCajaGeneralPayload,
  TrasladoCajaGeneralPayload,
} from './caja.schemas';

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

function dailyCajaName(dateKey = formatDateKey()) {
  return `Caja diaria ${dateKey}`;
}

function generalCajaName() {
  return 'Caja general';
}

async function findDailyCaja(tx: Prisma.TransactionClient, dateKey = formatDateKey()) {
  const { start, end } = getDateRange(dateKey);

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
      nombre: generalCajaName(),
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

export async function ensureOpenDailyCaja(
  tx: Prisma.TransactionClient,
  usuarioId?: string,
  dateKey = formatDateKey()
) {
  const existing = await findDailyCaja(tx, dateKey);

  if (existing) {
    if (existing.estado !== EstadoCaja.ABIERTA) {
      throw new AppError('La caja diaria de hoy ya esta cerrada. No se pueden registrar ventas.', 409);
    }

    return existing;
  }

  const caja = await tx.caja.create({
    data: {
      nombre: dailyCajaName(dateKey),
      tipo: TipoCaja.DIARIA,
      estado: EstadoCaja.ABIERTA,
      saldoActual: 0,
      descripcion: 'Caja diaria creada automaticamente al registrar la primera venta.',
      permiteVenta: true,
    },
  });

  await tx.movimientoCaja.create({
    data: {
      cajaId: caja.id,
      usuarioId,
      tipo: TipoMovimientoCaja.APERTURA,
      valor: 0,
      saldoAnterior: 0,
      saldoPosterior: 0,
      descripcion: `Apertura automatica de ${caja.nombre}`,
      referenciaTipo: 'CAJA',
      referenciaId: caja.id,
    },
  });

  return caja;
}

async function buildDailySummary(cajaId?: string) {
  if (!cajaId) {
    return {
      ingresosVentas: 0,
      egresos: 0,
      ventasCount: 0,
      utilidadVentas: 0,
      pagosPorMetodo: [],
    };
  }

  const [ventasAgg, egresosAgg, pagosGroup] = await Promise.all([
    prismaClient().venta.aggregate({
      where: {
        cajaId,
        estado: EstadoVenta.PAGADA,
      },
      _count: { _all: true },
      _sum: {
        total: true,
        utilidadTotal: true,
      },
    }),
    prismaClient().movimientoCaja.aggregate({
      where: {
        cajaId,
        tipo: {
          in: [TipoMovimientoCaja.EGRESO, TipoMovimientoCaja.TRASLADO_SALIDA],
        },
      },
      _sum: { valor: true },
    }),
    prismaClient().pagoVenta.groupBy({
      by: ['metodo'],
      where: {
        cajaId,
        estado: EstadoPagoVenta.CONFIRMADO,
      },
      _sum: { valor: true },
      _count: { _all: true },
    }),
  ]);

  return {
    ingresosVentas: Number(ventasAgg._sum.total || 0),
    egresos: Number(egresosAgg._sum.valor || 0),
    ventasCount: ventasAgg._count._all,
    utilidadVentas: Number(ventasAgg._sum.utilidadTotal || 0),
    pagosPorMetodo: pagosGroup.map((item) => ({
      metodo: item.metodo,
      total: Number(item._sum.valor || 0),
      cantidad: item._count._all,
    })),
  };
}

export async function getCajaGeneral() {
  const prisma = prismaClient();

  const caja = await prisma.$transaction((tx) => findOrCreateGeneralCaja(tx));
  const [movimientos, retiros] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: { cajaId: caja.id },
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
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    }),
    prisma.retiroCajaMayor.findMany({
      where: {
        OR: [{ cajaOrigenId: caja.id }, { cajaDestinoId: caja.id }],
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
        cajaOrigen: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
        cajaDestino: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    }),
  ]);

  return {
    caja,
    movimientos,
    retiros,
  };
}

export async function getCajaDiaria(dateKey = formatDateKey()) {
  const prisma = prismaClient();
  const caja = await findDailyCaja(prisma, dateKey);
  const movimientos = caja
    ? await prisma.movimientoCaja.findMany({
        where: { cajaId: caja.id },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
          venta: {
            select: {
              id: true,
              numero: true,
              total: true,
            },
          },
          pagoVenta: {
            select: {
              id: true,
              metodo: true,
              valor: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 100,
      })
    : [];

  const ultimoCierre = caja
    ? await prisma.cierreCaja.findFirst({
        where: { cajaId: caja.id },
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
        orderBy: [{ createdAt: 'desc' }],
      })
    : null;

  return {
    fecha: dateKey,
    caja,
    resumen: await buildDailySummary(caja?.id),
    movimientos,
    ultimoCierre,
    metodosPago: Object.values(MetodoPago),
  };
}

export async function abrirCajaDiaria(payload: AperturaCajaPayload, usuarioId?: string) {
  const prisma = prismaClient();
  const dateKey = formatDateKey();

  await prisma.$transaction(async (tx) => {
    const existing = await findDailyCaja(tx, dateKey);

    if (existing) {
      if (existing.estado === EstadoCaja.CERRADA) {
        const saldoDiariaAnterior = Number(existing.saldoActual || 0);

        await tx.caja.update({
          where: { id: existing.id },
          data: {
            estado: EstadoCaja.ABIERTA,
            permiteVenta: true,
            descripcion: payload.descripcion || existing.descripcion,
          },
        });

        await tx.movimientoCaja.create({
          data: {
            cajaId: existing.id,
            usuarioId,
            tipo: TipoMovimientoCaja.APERTURA,
            valor: saldoDiariaAnterior,
            saldoAnterior: saldoDiariaAnterior,
            saldoPosterior: saldoDiariaAnterior,
            descripcion: 'Reapertura de caja diaria',
            referenciaTipo: 'CAJA',
            referenciaId: existing.id,
          },
        });

        if (payload.saldoInicial > 0) {
          const cajaGeneral = await findOrCreateGeneralCaja(tx);
          const saldoGeneralAnterior = Number(cajaGeneral.saldoActual || 0);
          const saldoGeneralPosterior = saldoGeneralAnterior - payload.saldoInicial;
          const saldoDiariaPosterior = saldoDiariaAnterior + payload.saldoInicial;

          const traslado = await tx.retiroCajaMayor.create({
            data: {
              usuarioId,
              cajaOrigenId: cajaGeneral.id,
              cajaDestinoId: existing.id,
              valor: payload.saldoInicial,
              motivo: 'Base inicial de caja diaria',
              observacion: payload.descripcion,
            },
          });

          await tx.caja.update({
            where: { id: cajaGeneral.id },
            data: { saldoActual: saldoGeneralPosterior },
          });

          await tx.caja.update({
            where: { id: existing.id },
            data: { saldoActual: saldoDiariaPosterior },
          });

          await tx.movimientoCaja.create({
            data: {
              cajaId: cajaGeneral.id,
              usuarioId,
              tipo: TipoMovimientoCaja.TRASLADO_SALIDA,
              valor: payload.saldoInicial,
              saldoAnterior: saldoGeneralAnterior,
              saldoPosterior: saldoGeneralPosterior,
              descripcion: `Base inicial enviada a ${existing.nombre}`,
              referenciaTipo: 'RETIRO_CAJA_MAYOR',
              referenciaId: traslado.id,
            },
          });

          await tx.movimientoCaja.create({
            data: {
              cajaId: existing.id,
              usuarioId,
              tipo: TipoMovimientoCaja.TRASLADO_ENTRADA,
              valor: payload.saldoInicial,
              saldoAnterior: saldoDiariaAnterior,
              saldoPosterior: saldoDiariaPosterior,
              descripcion: 'Base inicial recibida desde caja general',
              referenciaTipo: 'RETIRO_CAJA_MAYOR',
              referenciaId: traslado.id,
            },
          });
        }
      }

      return;
    }

    const caja = await tx.caja.create({
      data: {
        nombre: dailyCajaName(dateKey),
        tipo: TipoCaja.DIARIA,
        estado: EstadoCaja.ABIERTA,
        saldoActual: 0,
        descripcion: payload.descripcion,
        permiteVenta: true,
      },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        usuarioId,
        tipo: TipoMovimientoCaja.APERTURA,
        valor: 0,
        saldoAnterior: 0,
        saldoPosterior: 0,
        descripcion: 'Apertura manual de caja diaria',
        referenciaTipo: 'CAJA',
        referenciaId: caja.id,
      },
    });

    if (payload.saldoInicial > 0) {
      const cajaGeneral = await findOrCreateGeneralCaja(tx);
      const saldoGeneralAnterior = Number(cajaGeneral.saldoActual || 0);
      const saldoGeneralPosterior = saldoGeneralAnterior - payload.saldoInicial;

      const traslado = await tx.retiroCajaMayor.create({
        data: {
          usuarioId,
          cajaOrigenId: cajaGeneral.id,
          cajaDestinoId: caja.id,
          valor: payload.saldoInicial,
          motivo: 'Base inicial de caja diaria',
          observacion: payload.descripcion,
        },
      });

      await tx.caja.update({
        where: { id: cajaGeneral.id },
        data: { saldoActual: saldoGeneralPosterior },
      });

      await tx.caja.update({
        where: { id: caja.id },
        data: { saldoActual: payload.saldoInicial },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: cajaGeneral.id,
          usuarioId,
          tipo: TipoMovimientoCaja.TRASLADO_SALIDA,
          valor: payload.saldoInicial,
          saldoAnterior: saldoGeneralAnterior,
          saldoPosterior: saldoGeneralPosterior,
          descripcion: `Base inicial enviada a ${caja.nombre}`,
          referenciaTipo: 'RETIRO_CAJA_MAYOR',
          referenciaId: traslado.id,
        },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          usuarioId,
          tipo: TipoMovimientoCaja.TRASLADO_ENTRADA,
          valor: payload.saldoInicial,
          saldoAnterior: 0,
          saldoPosterior: payload.saldoInicial,
          descripcion: 'Base inicial recibida desde caja general',
          referenciaTipo: 'RETIRO_CAJA_MAYOR',
          referenciaId: traslado.id,
        },
      });
    }
  });

  return getCajaDiaria(dateKey);
}

export async function trasladarDesdeCajaDiaria(
  payload: TrasladoCajaGeneralPayload,
  usuarioId?: string
) {
  const prisma = prismaClient();

  await prisma.$transaction(async (tx) => {
    const cajaDestino = await findOrCreateGeneralCaja(tx);
    const cajaOrigen = payload.cajaOrigenId
      ? await tx.caja.findUnique({ where: { id: payload.cajaOrigenId } })
      : await findDailyCaja(tx);

    if (!cajaOrigen) {
      throw new AppError('No hay una caja diaria disponible para trasladar.', 404);
    }

    if (cajaOrigen.tipo !== TipoCaja.DIARIA) {
      throw new AppError('La caja origen debe ser una caja diaria.', 409);
    }

    if (cajaOrigen.id === cajaDestino.id) {
      throw new AppError('La caja origen y destino no pueden ser la misma.', 409);
    }

    const saldoOrigenAnterior = Number(cajaOrigen.saldoActual || 0);

    if (saldoOrigenAnterior < payload.valor) {
      throw new AppError('La caja diaria no tiene saldo suficiente para este traslado.', 409);
    }

    const saldoDestinoAnterior = Number(cajaDestino.saldoActual || 0);
    const saldoOrigenPosterior = saldoOrigenAnterior - payload.valor;
    const saldoDestinoPosterior = saldoDestinoAnterior + payload.valor;

    const retiro = await tx.retiroCajaMayor.create({
      data: {
        usuarioId,
        cajaOrigenId: cajaOrigen.id,
        cajaDestinoId: cajaDestino.id,
        valor: payload.valor,
        motivo: payload.motivo,
        observacion: payload.observacion,
      },
    });

    await tx.caja.update({
      where: { id: cajaOrigen.id },
      data: { saldoActual: saldoOrigenPosterior },
    });

    await tx.caja.update({
      where: { id: cajaDestino.id },
      data: { saldoActual: saldoDestinoPosterior },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: cajaOrigen.id,
        usuarioId,
        tipo: TipoMovimientoCaja.TRASLADO_SALIDA,
        valor: payload.valor,
        saldoAnterior: saldoOrigenAnterior,
        saldoPosterior: saldoOrigenPosterior,
        descripcion: `Traslado a caja general: ${payload.motivo}`,
        referenciaTipo: 'RETIRO_CAJA_MAYOR',
        referenciaId: retiro.id,
      },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: cajaDestino.id,
        usuarioId,
        tipo: TipoMovimientoCaja.TRASLADO_ENTRADA,
        valor: payload.valor,
        saldoAnterior: saldoDestinoAnterior,
        saldoPosterior: saldoDestinoPosterior,
        descripcion: `Traslado desde ${cajaOrigen.nombre}: ${payload.motivo}`,
        referenciaTipo: 'RETIRO_CAJA_MAYOR',
        referenciaId: retiro.id,
      },
    });
  });

  return getCajaGeneral();
}

export async function registrarSalidaCajaGeneral(
  payload: SalidaCajaGeneralPayload,
  usuarioId?: string
) {
  const prisma = prismaClient();

  await prisma.$transaction(async (tx) => {
    const caja = await findOrCreateGeneralCaja(tx);
    const saldoAnterior = Number(caja.saldoActual || 0);

    if (saldoAnterior < payload.valor) {
      throw new AppError('La caja general no tiene saldo suficiente para esta salida.', 409);
    }

    const saldoPosterior = saldoAnterior - payload.valor;

    const retiro = await tx.retiroCajaMayor.create({
      data: {
        usuarioId,
        cajaOrigenId: caja.id,
        valor: payload.valor,
        motivo: payload.motivo,
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
        tipo: TipoMovimientoCaja.EGRESO,
        valor: payload.valor,
        saldoAnterior,
        saldoPosterior,
        descripcion: `Salida de caja general: ${payload.motivo}`,
        referenciaTipo: 'RETIRO_CAJA_MAYOR',
        referenciaId: retiro.id,
      },
    });
  });

  return getCajaGeneral();
}

export async function cerrarCajaDiaria(payload: CierreCajaPayload, usuarioId?: string) {
  const prisma = prismaClient();
  const dateKey = formatDateKey();

  await prisma.$transaction(async (tx) => {
    const caja = await findDailyCaja(tx, dateKey);

    if (!caja) {
      throw new AppError('No hay una caja diaria abierta para cerrar.', 404);
    }

    if (caja.estado !== EstadoCaja.ABIERTA) {
      throw new AppError('La caja diaria ya no esta abierta.', 409);
    }

    const saldoEsperado = Number(caja.saldoActual || 0);
    const diferencia = payload.saldoReal - saldoEsperado;

    await tx.cierreCaja.create({
      data: {
        cajaId: caja.id,
        usuarioId,
        fechaApertura: caja.createdAt,
        saldoInicial: 0,
        saldoEsperado,
        saldoReal: payload.saldoReal,
        diferencia,
        observaciones: payload.observaciones,
      },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        usuarioId,
        tipo: TipoMovimientoCaja.CIERRE,
        valor: payload.saldoReal,
        saldoAnterior: saldoEsperado,
        saldoPosterior: payload.saldoReal,
        descripcion: 'Cierre de caja diaria',
        referenciaTipo: 'CAJA',
        referenciaId: caja.id,
      },
    });

    if (payload.saldoReal > 0) {
      const cajaGeneral = await findOrCreateGeneralCaja(tx);
      const saldoGeneralAnterior = Number(cajaGeneral.saldoActual || 0);
      const saldoGeneralPosterior = saldoGeneralAnterior + payload.saldoReal;

      const traslado = await tx.retiroCajaMayor.create({
        data: {
          usuarioId,
          cajaOrigenId: caja.id,
          cajaDestinoId: cajaGeneral.id,
          valor: payload.saldoReal,
          motivo: 'Cierre de caja diaria',
          observacion: payload.observaciones,
        },
      });

      await tx.caja.update({
        where: { id: cajaGeneral.id },
        data: { saldoActual: saldoGeneralPosterior },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          usuarioId,
          tipo: TipoMovimientoCaja.TRASLADO_SALIDA,
          valor: payload.saldoReal,
          saldoAnterior: payload.saldoReal,
          saldoPosterior: 0,
          descripcion: 'Traslado a caja general por cierre diario',
          referenciaTipo: 'RETIRO_CAJA_MAYOR',
          referenciaId: traslado.id,
        },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: cajaGeneral.id,
          usuarioId,
          tipo: TipoMovimientoCaja.TRASLADO_ENTRADA,
          valor: payload.saldoReal,
          saldoAnterior: saldoGeneralAnterior,
          saldoPosterior: saldoGeneralPosterior,
          descripcion: `Cierre recibido desde ${caja.nombre}`,
          referenciaTipo: 'RETIRO_CAJA_MAYOR',
          referenciaId: traslado.id,
        },
      });
    }

    await tx.caja.update({
      where: { id: caja.id },
      data: {
        estado: EstadoCaja.CERRADA,
        saldoActual: 0,
        permiteVenta: false,
      },
    });
  });

  return getCajaDiaria(dateKey);
}
