import {
  EstadoPagoVenta,
  EstadoVenta,
  Prisma,
  TipoCaja,
  TipoMovimientoCaja,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function toMoney(value: Prisma.Decimal | number | string | null | undefined) {
  return Number(value || 0);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toWeekKey(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  return toDateKey(weekStart);
}

function parseDateKey(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return { start, end };
}

export function parseInformeFilters(query: Record<string, unknown>) {
  const defaults = getDefaultRange();
  const start = parseDateKey(query.desde) || defaults.start;
  const endBase = parseDateKey(query.hasta);
  const end = endBase
    ? new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() + 1, 0, 0, 0, 0)
    : defaults.end;

  if (start >= end) {
    throw new AppError('La fecha inicial debe ser menor o igual a la fecha final.', 400);
  }

  return {
    start,
    end,
    desde: toDateKey(start),
    hasta: toDateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)),
  };
}

function makeBucket(periodo: string) {
  return {
    periodo,
    ventas: 0,
    unidades: 0,
    total: 0,
    utilidad: 0,
  };
}

const TIPOS_ENTRADA_CAJA: TipoMovimientoCaja[] = [
  TipoMovimientoCaja.INGRESO,
  TipoMovimientoCaja.TRASLADO_ENTRADA,
  TipoMovimientoCaja.APERTURA,
];

const TIPOS_SALIDA_CAJA: TipoMovimientoCaja[] = [
  TipoMovimientoCaja.EGRESO,
  TipoMovimientoCaja.TRASLADO_SALIDA,
];

function addVentaToBucket(
  map: Map<string, ReturnType<typeof makeBucket>>,
  key: string,
  venta: { total: Prisma.Decimal; utilidadTotal: Prisma.Decimal; items: { cantidad: number }[] }
) {
  const bucket = map.get(key) || makeBucket(key);
  bucket.ventas += 1;
  bucket.unidades += venta.items.reduce((sum, item) => sum + item.cantidad, 0);
  bucket.total += toMoney(venta.total);
  bucket.utilidad += toMoney(venta.utilidadTotal);
  map.set(key, bucket);
}

export async function getInformeAdministrativo(filters: ReturnType<typeof parseInformeFilters>) {
  const prisma = prismaClient();
  const rangeWhere = {
    gte: filters.start,
    lt: filters.end,
  };

  const [ventas, pagosPorMetodo, variantes, cajasDiarias, cajaGeneral, fondos, gastosPorCategoria] =
    await Promise.all([
      prisma.venta.findMany({
        where: {
          estado: EstadoVenta.PAGADA,
          createdAt: rangeWhere,
        },
        include: {
          items: {
            include: {
              variante: {
                include: {
                  producto: {
                    include: {
                      categoria: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      }),
      prisma.pagoVenta.groupBy({
        by: ['metodo'],
        where: {
          estado: EstadoPagoVenta.CONFIRMADO,
          createdAt: rangeWhere,
        },
        _sum: { valor: true },
        _count: { _all: true },
      }),
      prisma.productoVariante.findMany({
        where: {
          OR: [
            { stockActual: { lte: 0 } },
            {
              AND: [{ stockMinimo: { gt: 0 } }, { stockActual: { lte: prisma.productoVariante.fields.stockMinimo } }],
            },
          ],
        },
        include: {
          producto: {
            include: {
              categoria: true,
            },
          },
        },
        orderBy: [{ stockActual: 'asc' }, { updatedAt: 'desc' }],
        take: 100,
      }),
      prisma.caja.findMany({
        where: {
          tipo: TipoCaja.DIARIA,
          createdAt: rangeWhere,
        },
        include: {
          cierres: {
            orderBy: [{ fechaCierre: 'desc' }],
            take: 1,
          },
          movimientos: {
            where: { createdAt: rangeWhere },
            orderBy: [{ createdAt: 'asc' }],
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.caja.findFirst({
        where: { tipo: TipoCaja.MAYOR },
        include: {
          movimientos: {
            where: { createdAt: rangeWhere },
            orderBy: [{ createdAt: 'desc' }],
            take: 100,
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      }),
      prisma.fondoMeta.findMany({
        include: {
          apartados: {
            where: { createdAt: rangeWhere },
            orderBy: [{ createdAt: 'desc' }],
          },
          gastos: {
            where: {
              anuladoAt: null,
              createdAt: rangeWhere,
            },
            orderBy: [{ createdAt: 'desc' }],
          },
        },
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
      }),
      prisma.gasto.groupBy({
        by: ['categoria'],
        where: {
          anuladoAt: null,
          createdAt: rangeWhere,
        },
        _sum: { valor: true },
        _count: { _all: true },
      }),
    ]);

  const ventasDia = new Map<string, ReturnType<typeof makeBucket>>();
  const ventasSemana = new Map<string, ReturnType<typeof makeBucket>>();
  const ventasMes = new Map<string, ReturnType<typeof makeBucket>>();
  const utilidadProductos = new Map<string, any>();
  const utilidadCategorias = new Map<string, any>();

  for (const venta of ventas) {
    addVentaToBucket(ventasDia, toDateKey(venta.createdAt), venta);
    addVentaToBucket(ventasSemana, toWeekKey(venta.createdAt), venta);
    addVentaToBucket(ventasMes, toMonthKey(venta.createdAt), venta);

    for (const item of venta.items) {
      const producto = item.variante.producto;
      const categoria = producto.categoria;
      const productKey = producto.id;
      const categoryKey = categoria.id;
      const currentProduct = utilidadProductos.get(productKey) || {
        productoId: producto.id,
        producto: producto.nombre,
        categoria: categoria.nombre,
        unidades: 0,
        ventas: 0,
        costo: 0,
        utilidad: 0,
      };
      const currentCategory = utilidadCategorias.get(categoryKey) || {
        categoriaId: categoria.id,
        categoria: categoria.nombre,
        unidades: 0,
        ventas: 0,
        costo: 0,
        utilidad: 0,
      };
      const ventaItem = toMoney(item.subtotal);
      const utilidadItem = toMoney(item.utilidad);
      const costoItem = toMoney(item.costoUnitario) * item.cantidad;

      currentProduct.unidades += item.cantidad;
      currentProduct.ventas += ventaItem;
      currentProduct.costo += costoItem;
      currentProduct.utilidad += utilidadItem;
      currentCategory.unidades += item.cantidad;
      currentCategory.ventas += ventaItem;
      currentCategory.costo += costoItem;
      currentCategory.utilidad += utilidadItem;

      utilidadProductos.set(productKey, currentProduct);
      utilidadCategorias.set(categoryKey, currentCategory);
    }
  }

  const cajaDiaria = cajasDiarias.map((caja) => {
    const ingresos = caja.movimientos
      .filter((movimiento) => TIPOS_ENTRADA_CAJA.includes(movimiento.tipo))
      .reduce((sum, movimiento) => sum + toMoney(movimiento.valor), 0);
    const egresos = caja.movimientos
      .filter((movimiento) => TIPOS_SALIDA_CAJA.includes(movimiento.tipo))
      .reduce((sum, movimiento) => sum + toMoney(movimiento.valor), 0);
    const cierre = caja.cierres[0] || null;

    return {
      id: caja.id,
      fecha: toDateKey(caja.createdAt),
      nombre: caja.nombre,
      estado: caja.estado,
      ingresos,
      egresos,
      saldoActual: toMoney(caja.saldoActual),
      saldoReal: cierre ? toMoney(cierre.saldoReal) : null,
      saldoEsperado: cierre ? toMoney(cierre.saldoEsperado) : null,
      diferencia: cierre ? toMoney(cierre.diferencia) : null,
    };
  });

  const cajaGeneralIngresos =
    cajaGeneral?.movimientos
      .filter((movimiento) => TIPOS_ENTRADA_CAJA.includes(movimiento.tipo))
      .reduce((sum, movimiento) => sum + toMoney(movimiento.valor), 0) || 0;
  const cajaGeneralEgresos =
    cajaGeneral?.movimientos
      .filter((movimiento) => TIPOS_SALIDA_CAJA.includes(movimiento.tipo))
      .reduce((sum, movimiento) => sum + toMoney(movimiento.valor), 0) || 0;

  const fondosMeta = fondos.map((fondo) => {
    const aportadoPeriodo = fondo.apartados.reduce((sum, item) => sum + toMoney(item.valor), 0);
    const gastadoPeriodo = fondo.gastos.reduce((sum, item) => sum + toMoney(item.valor), 0);
    const metaTotal = toMoney(fondo.metaTotal);
    const acumulado = toMoney(fondo.acumulado);

    return {
      id: fondo.id,
      nombre: fondo.nombre,
      activo: fondo.activo,
      metaTotal,
      acumulado,
      avance: metaTotal > 0 ? Math.round((acumulado / metaTotal) * 10000) / 100 : 0,
      aportadoPeriodo,
      gastadoPeriodo,
    };
  });

  const stock = variantes.map((variante) => ({
    id: variante.id,
    producto: variante.producto.nombre,
    categoria: variante.producto.categoria.nombre,
    sku: variante.sku,
    talla: variante.talla,
    color: variante.color,
    stockActual: variante.stockActual,
    stockMinimo: variante.stockMinimo,
    estado: variante.stockActual <= 0 ? 'AGOTADO' : 'BAJO',
  }));

  const rankingProductos = [...utilidadProductos.values()]
    .sort((a, b) => b.unidades - a.unidades || b.ventas - a.ventas)
    .slice(0, 20);

  const utilidadPorProducto = [...utilidadProductos.values()].sort((a, b) => b.utilidad - a.utilidad);
  const utilidadPorCategoria = [...utilidadCategorias.values()].sort((a, b) => b.utilidad - a.utilidad);

  return {
    filtros: {
      desde: filters.desde,
      hasta: filters.hasta,
    },
    resumen: {
      ventas: ventas.length,
      unidadesVendidas: ventas.reduce(
        (sum, venta) => sum + venta.items.reduce((itemSum, item) => itemSum + item.cantidad, 0),
        0
      ),
      totalVentas: ventas.reduce((sum, venta) => sum + toMoney(venta.total), 0),
      utilidadTotal: ventas.reduce((sum, venta) => sum + toMoney(venta.utilidadTotal), 0),
      gastosTotal: gastosPorCategoria.reduce((sum, item) => sum + toMoney(item._sum.valor), 0),
      stockBajo: stock.filter((item) => item.estado === 'BAJO').length,
      agotados: stock.filter((item) => item.estado === 'AGOTADO').length,
      cajaGeneralSaldo: toMoney(cajaGeneral?.saldoActual),
    },
    ventas: {
      dia: [...ventasDia.values()],
      semana: [...ventasSemana.values()],
      mes: [...ventasMes.values()],
      pagosPorMetodo: pagosPorMetodo.map((item) => ({
        metodo: item.metodo,
        total: toMoney(item._sum.valor),
        cantidad: item._count._all,
      })),
    },
    utilidad: {
      productos: utilidadPorProducto,
      categorias: utilidadPorCategoria,
    },
    inventario: {
      stock,
    },
    caja: {
      diaria: cajaDiaria,
      general: {
        id: cajaGeneral?.id || null,
        nombre: cajaGeneral?.nombre || 'Caja general',
        saldoActual: toMoney(cajaGeneral?.saldoActual),
        ingresos: cajaGeneralIngresos,
        egresos: cajaGeneralEgresos,
        movimientos: cajaGeneral?.movimientos.length || 0,
      },
    },
    fondos: fondosMeta,
    gastos: {
      categorias: gastosPorCategoria
        .map((item) => ({
          categoria: item.categoria,
          total: toMoney(item._sum.valor),
          cantidad: item._count._all,
        }))
        .sort((a, b) => b.total - a.total),
    },
    ranking: {
      productos: rankingProductos,
    },
  };
}
