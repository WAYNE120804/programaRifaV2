import {
  Prisma,
  EstadoProducto,
  EstadoVenta,
  EstadoPagoVenta,
  TipoMovimientoInventario,
  TipoMovimientoCaja,
  MetodoPago,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { ensureOpenDailyCaja } from '../cajas/caja.service';
import { getOrCreateGenericClient } from '../clientes/cliente.service';
import { getPrisma } from '../../lib/prisma';
import type { VentaPayload } from './venta.schemas';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

const ventaInclude = Prisma.validator<Prisma.VentaInclude>()({
  cliente: {
    select: {
      id: true,
      nombreCompleto: true,
      cedula: true,
      telefonoCelular: true,
      email: true,
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
  items: {
    include: {
      variante: {
        include: {
          producto: {
            include: {
              categoria: true,
            },
          },
          codigos: {
            orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }],
  },
  pagos: {
    orderBy: [{ createdAt: 'asc' }],
  },
});

type VariantSnapshot = {
  id: string;
  talla: string;
  color: string;
  sku: string | null;
  stockActual: number;
  costoPromedio: Prisma.Decimal;
  precioVenta: Prisma.Decimal;
  estado: EstadoProducto;
  producto: {
    id: string;
    nombre: string;
    marca: string | null;
    categoria: {
      id: string;
      nombre: string;
      codigo: string | null;
    };
  };
};

function formatVariantDescriptor(input: { color: string; talla: string }) {
  const color = (input.color || '').toUpperCase();
  const talla = (input.talla || '').toUpperCase();

  if (color === 'NO APLICA' && talla === 'NO APLICA') {
    return 'sin color ni talla';
  }

  if (color === 'NO APLICA') {
    return `talla ${input.talla}`;
  }

  if (talla === 'NO APLICA') {
    return `color ${input.color}`;
  }

  return `${input.color}/${input.talla}`;
}

function groupItems(items: VentaPayload['items']) {
  const grouped = new Map<string, number>();

  for (const item of items) {
    grouped.set(item.varianteId, (grouped.get(item.varianteId) || 0) + item.cantidad);
  }

  return grouped;
}

function toMoneyNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

export async function listVentas(filters?: { search?: string; estado?: string }) {
  const search = filters?.search?.trim();
  const estado =
    typeof filters?.estado === 'string' && filters.estado in EstadoVenta
      ? (filters.estado as EstadoVenta)
      : undefined;

  return prismaClient().venta.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(search
        ? {
            OR: [
              { observaciones: { contains: search, mode: 'insensitive' } },
              { cliente: { nombreCompleto: { contains: search, mode: 'insensitive' } } },
              { usuario: { nombre: { contains: search, mode: 'insensitive' } } },
              {
                items: {
                  some: {
                    variante: {
                      OR: [
                        { sku: { contains: search, mode: 'insensitive' } },
                        { color: { contains: search, mode: 'insensitive' } },
                        { talla: { contains: search, mode: 'insensitive' } },
                        {
                          producto: {
                            nombre: { contains: search, mode: 'insensitive' },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: ventaInclude,
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
  });
}

export async function getVentaById(id: string) {
  const venta = await prismaClient().venta.findUnique({
    where: { id },
    include: ventaInclude,
  });

  if (!venta) {
    throw new AppError('La venta no existe.', 404);
  }

  return venta;
}

export async function createVenta(payload: VentaPayload, usuarioId?: string) {
  const prisma = prismaClient();
  const groupedItems = groupItems(payload.items);
  const variantIds = [...groupedItems.keys()];
  let clienteId = payload.clienteId;

  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true },
    });

    if (!cliente) {
      throw new AppError('El cliente seleccionado ya no existe.', 404);
    }
  } else {
    const genericClient = await getOrCreateGenericClient();
    clienteId = genericClient.id;
  }

  const variants = await prisma.productoVariante.findMany({
    where: {
      id: { in: variantIds },
    },
    select: {
      id: true,
      talla: true,
      color: true,
      sku: true,
      stockActual: true,
      costoPromedio: true,
      precioVenta: true,
      estado: true,
      producto: {
        select: {
          id: true,
          nombre: true,
          marca: true,
          categoria: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  if (variants.length !== variantIds.length) {
    throw new AppError('Una o varias variantes ya no existen.', 404);
  }

  const variantMap = new Map<string, VariantSnapshot>(
    variants.map((variant) => [variant.id, variant])
  );

  const ventaItems = payload.items.map((item) => {
    const variant = variantMap.get(item.varianteId);

    if (!variant) {
      throw new AppError('Una o varias variantes ya no existen.', 404);
    }

    if (variant.stockActual < item.cantidad) {
      throw new AppError(
        `No hay suficiente stock para "${variant.producto.nombre}" (${formatVariantDescriptor(variant)}). Disponible: ${variant.stockActual}.`,
        409
      );
    }

    const costoUnitario = toMoneyNumber(variant.costoPromedio);
    const precioUnitario = toMoneyNumber(variant.precioVenta);
    const subtotal = precioUnitario * item.cantidad;
    const utilidad = (precioUnitario - costoUnitario) * item.cantidad;

    return {
      variante: variant,
      cantidad: item.cantidad,
      costoUnitario,
      precioUnitario,
      subtotal,
      utilidad,
    };
  });

  const subtotal = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;
  const utilidadTotal = ventaItems.reduce((sum, item) => sum + item.utilidad, 0);
  const valorPagado = total;

  if (payload.valorRecibido < total) {
    throw new AppError('El valor recibido no puede ser menor al total de la venta.', 409);
  }

  return prisma.$transaction(async (tx) => {
    const caja = await ensureOpenDailyCaja(tx, usuarioId);
    const venta = await tx.venta.create({
      data: {
        clienteId,
        usuarioId,
        cajaId: caja.id,
        estado: EstadoVenta.PAGADA,
        subtotal,
        total,
        totalPagado: valorPagado,
        utilidadTotal,
        observaciones: payload.observaciones,
        items: {
          create: ventaItems.map((item) => ({
            varianteId: item.variante.id,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
            utilidad: item.utilidad,
          })),
        },
        pagos: {
          create: {
            usuarioId,
            cajaId: caja.id,
            metodo: payload.metodoPago,
            estado: EstadoPagoVenta.CONFIRMADO,
            valor: total,
            observacion:
              payload.valorRecibido > total
                ? `Valor recibido: ${payload.valorRecibido}`
                : null,
          },
        },
      },
      include: ventaInclude,
    });
    const pago = venta.pagos[0];
    const saldoAnteriorCaja = Number(caja.saldoActual || 0);
    const saldoPosteriorCaja = saldoAnteriorCaja + total;

    await tx.caja.update({
      where: { id: caja.id },
      data: { saldoActual: saldoPosteriorCaja },
    });

    await tx.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        usuarioId,
        ventaId: venta.id,
        pagoVentaId: pago?.id,
        tipo: TipoMovimientoCaja.INGRESO,
        valor: total,
        saldoAnterior: saldoAnteriorCaja,
        saldoPosterior: saldoPosteriorCaja,
        descripcion: `Venta #${venta.numero}`,
        referenciaTipo: 'VENTA',
        referenciaId: venta.id,
      },
    });

    for (const item of ventaItems) {
      const stockAnterior = item.variante.stockActual;
      const stockPosterior = stockAnterior - item.cantidad;

      await tx.productoVariante.update({
        where: { id: item.variante.id },
        data: {
          stockActual: stockPosterior,
          estado:
            stockPosterior <= 0
              ? EstadoProducto.AGOTADO
              : item.variante.estado === EstadoProducto.AGOTADO
                ? EstadoProducto.ACTIVO
                : item.variante.estado,
        },
      });

      await tx.movimientoInventario.create({
        data: {
          varianteId: item.variante.id,
          usuarioId,
          tipo: TipoMovimientoInventario.VENTA,
          cantidad: item.cantidad,
          stockAnterior,
          stockPosterior,
          costoUnitario: item.costoUnitario,
          precioUnitario: item.precioUnitario,
          detalle: `Venta #${venta.numero} - ${item.variante.producto.nombre} (${formatVariantDescriptor(item.variante)})`,
          referenciaTipo: 'VENTA',
          referenciaId: venta.id,
        },
      });
    }

    const touchedProductIds = [...new Set(ventaItems.map((item) => item.variante.producto.id))];

    for (const productoId of touchedProductIds) {
      const variantsForProduct = await tx.productoVariante.findMany({
        where: { productoId },
        select: {
          stockActual: true,
          estado: true,
        },
      });

      const nextState = variantsForProduct.some((variant) => variant.stockActual > 0)
        ? EstadoProducto.ACTIVO
        : EstadoProducto.AGOTADO;

      await tx.producto.update({
        where: { id: productoId },
        data: { estado: nextState },
      });
    }

    return {
      ...(await tx.venta.findUniqueOrThrow({
        where: { id: venta.id },
        include: ventaInclude,
      })),
      valorRecibido: payload.valorRecibido,
      cambio: payload.valorRecibido - total,
    };
  });
}
