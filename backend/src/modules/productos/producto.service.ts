import {
  Prisma,
  EstadoProducto,
  TipoCodigoProducto,
  TipoMovimientoInventario,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { ProductoPayload, ProductoVariantePayload } from './producto.schemas';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

const productoInclude = Prisma.validator<Prisma.ProductoInclude>()({
  categoria: true,
  variantes: {
    include: {
      codigos: {
        orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }],
      },
      _count: {
        select: {
          movimientosInventario: true,
          ventaItems: true,
        },
      },
    },
    orderBy: [{ color: 'asc' }, { talla: 'asc' }],
  },
});

const varianteInclude = Prisma.validator<Prisma.ProductoVarianteInclude>()({
  producto: {
    include: {
      categoria: true,
    },
  },
  codigos: {
    orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }],
  },
  _count: {
    select: {
      movimientosInventario: true,
      ventaItems: true,
    },
  },
});

function computeCheckDigit(baseDigits: string) {
  const digits = baseDigits.split('').map(Number);

  const total = digits.reduce((sum, digit, index) => {
    const weight = index % 2 === 0 ? 1 : 3;
    return sum + digit * weight;
  }, 0);

  return String((10 - (total % 10)) % 10);
}

async function buildNextBarcode(
  tx: Prisma.TransactionClient,
  categoryCode: string,
  currentCode?: string | null
) {
  if (currentCode?.startsWith(categoryCode)) {
    return currentCode;
  }

  const existingCodes = await tx.codigoProducto.findMany({
    where: {
      codigo: {
        startsWith: categoryCode,
      },
      tipo: TipoCodigoProducto.BARRAS,
    },
    select: {
      codigo: true,
    },
  });

  let maxSequence = 0;

  for (const item of existingCodes) {
    const baseWithoutCheck = item.codigo.slice(0, -1);
    const sequence = Number(baseWithoutCheck.slice(2));

    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  const nextSequence = String(maxSequence + 1).padStart(6, '0');
  const baseCode = `${categoryCode}${nextSequence}`;
  return `${baseCode}${computeCheckDigit(baseCode)}`;
}

function normalizeSkuToken(
  value: string | null | undefined,
  fallback: string,
  maxLength: number
) {
  const normalized = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return (normalized || fallback).slice(0, maxLength);
}

function buildSkuPrefix(input: {
  categoriaNombre: string;
  marca: string | null;
  color: string;
  talla: string;
}) {
  const categoria = normalizeSkuToken(input.categoriaNombre, 'CAT', 3);
  const marca = normalizeSkuToken(input.marca, 'GEN', 3);
  const color = normalizeSkuToken(
    input.color?.toUpperCase() === 'NO APLICA' ? '' : input.color,
    'STD',
    3
  );
  const talla = normalizeSkuToken(
    input.talla?.toUpperCase() === 'NO APLICA' ? '' : input.talla,
    'U',
    4
  );

  return `${categoria}-${marca}-${color}-${talla}`;
}

async function buildNextSku(
  tx: Prisma.TransactionClient,
  input: {
    categoriaNombre: string;
    marca: string | null;
    color: string;
    talla: string;
    currentSku?: string | null;
  }
) {
  const prefix = buildSkuPrefix(input);

  if (input.currentSku?.startsWith(`${prefix}-`)) {
    return input.currentSku;
  }

  const existingSkus = await tx.productoVariante.findMany({
    where: {
      sku: {
        startsWith: `${prefix}-`,
      },
    },
    select: {
      sku: true,
    },
  });

  let maxSequence = 0;

  for (const item of existingSkus) {
    const sequence = Number(item.sku?.split('-').pop() || 0);

    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `${prefix}-${String(maxSequence + 1).padStart(3, '0')}`;
}

async function assertCategoriaExists(categoriaId: string) {
  const categoria = await prismaClient().categoriaProducto.findUnique({
    where: { id: categoriaId },
    select: { id: true, nombre: true, codigo: true },
  });

  if (!categoria) {
    throw new AppError('La categoria seleccionada no existe.', 404);
  }

  return categoria;
}

function buildVariantState(variante: ProductoVariantePayload) {
  if (variante.stockActual <= 0 && variante.estado === EstadoProducto.ACTIVO) {
    return EstadoProducto.AGOTADO;
  }

  return variante.estado;
}

function buildProductState(variants: Array<{ estado: EstadoProducto; stockActual: number }>) {
  const hasActiveStock = variants.some((variant) => variant.stockActual > 0);
  const hasActive = variants.some((variant) => variant.estado === EstadoProducto.ACTIVO);

  if (hasActiveStock && hasActive) {
    return EstadoProducto.ACTIVO;
  }

  if (!hasActiveStock) {
    return EstadoProducto.AGOTADO;
  }

  return EstadoProducto.INACTIVO;
}

async function createVariant(
  tx: Prisma.TransactionClient,
  input: {
    productoId: string;
    categoriaNombre: string;
    categoriaCodigo: string;
    marca: string | null;
    variante: ProductoVariantePayload;
    usuarioId?: string;
  }
) {
  const sku = await buildNextSku(tx, {
    categoriaNombre: input.categoriaNombre,
    marca: input.marca,
    color: input.variante.color,
    talla: input.variante.talla,
  });
  const barcode = await buildNextBarcode(tx, input.categoriaCodigo);
  const estado = buildVariantState(input.variante);

  const created = await tx.productoVariante.create({
    data: {
      productoId: input.productoId,
      talla: input.variante.talla,
      color: input.variante.color,
      sku,
      costoPromedio: input.variante.costoPromedio,
      precioVenta: input.variante.precioVenta,
      stockActual: input.variante.stockActual,
      stockMinimo: input.variante.stockMinimo,
      estado,
      permiteDecimal: input.variante.permiteDecimal,
      codigos: {
        create: [
          {
            codigo: barcode,
            tipo: TipoCodigoProducto.BARRAS,
            principal: true,
          },
        ],
      },
    },
    include: varianteInclude,
  });

  if (input.variante.stockActual > 0) {
    await tx.movimientoInventario.create({
      data: {
        varianteId: created.id,
        usuarioId: input.usuarioId,
        tipo: TipoMovimientoInventario.ENTRADA_INICIAL,
        cantidad: input.variante.stockActual,
        stockAnterior: 0,
        stockPosterior: input.variante.stockActual,
        costoUnitario: input.variante.costoPromedio,
        precioUnitario: input.variante.precioVenta,
        detalle: 'Stock inicial de la variante',
        referenciaTipo: 'PRODUCTO_VARIANTE',
        referenciaId: created.id,
      },
    });
  }

  return created;
}

function mapProductSummary(producto: any) {
  const stockTotal = producto.variantes.reduce(
    (sum: number, variante: any) => sum + Number(variante.stockActual || 0),
    0
  );

  return {
    ...producto,
    stockTotal,
    variantesCount: producto.variantes.length,
  };
}

export async function listProductos(filters?: {
  search?: string;
  categoriaId?: string;
  estado?: string;
}) {
  const search = filters?.search?.trim();
  const estado =
    typeof filters?.estado === 'string' && filters.estado in EstadoProducto
      ? (filters.estado as EstadoProducto)
      : undefined;

  const productos = await prismaClient().producto.findMany({
    where: {
      ...(filters?.categoriaId ? { categoriaId: filters.categoriaId } : {}),
      ...(estado ? { estado } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { marca: { contains: search, mode: 'insensitive' } },
              {
                variantes: {
                  some: {
                    OR: [
                      { sku: { contains: search, mode: 'insensitive' } },
                      { color: { contains: search, mode: 'insensitive' } },
                      { talla: { contains: search, mode: 'insensitive' } },
                      {
                        codigos: {
                          some: {
                            codigo: { contains: search, mode: 'insensitive' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: productoInclude,
    orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
  });

  return productos.map(mapProductSummary);
}

export async function listProductoVariantes(filters?: {
  search?: string;
  categoriaId?: string;
  estado?: string;
}) {
  const search = filters?.search?.trim();
  const estado =
    typeof filters?.estado === 'string' && filters.estado in EstadoProducto
      ? (filters.estado as EstadoProducto)
      : undefined;

  return prismaClient().productoVariante.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(filters?.categoriaId ? { producto: { categoriaId: filters.categoriaId } } : {}),
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              { color: { contains: search, mode: 'insensitive' } },
              { talla: { contains: search, mode: 'insensitive' } },
              { producto: { nombre: { contains: search, mode: 'insensitive' } } },
              {
                codigos: {
                  some: {
                    codigo: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: varianteInclude,
    orderBy: [{ producto: { nombre: 'asc' } }, { color: 'asc' }, { talla: 'asc' }],
  });
}

export async function getProductoById(id: string) {
  const producto = await prismaClient().producto.findUnique({
    where: { id },
    include: productoInclude,
  });

  if (!producto) {
    throw new AppError('El producto no existe.', 404);
  }

  return mapProductSummary(producto);
}

export async function createProducto(payload: ProductoPayload, usuarioId?: string) {
  const prisma = prismaClient();
  const categoria = await assertCategoriaExists(payload.categoriaId);
  const categoryCode = categoria.codigo || payload.categoriaCodigo;

  if (!categoryCode) {
    throw new AppError(
      'La categoria seleccionada no tiene codigo numerico configurado. Edita la categoria y asignale 2 digitos.',
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.create({
      data: {
        categoriaId: payload.categoriaId,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        marca: payload.marca,
        genero: payload.genero,
        estado: payload.estado,
        imagenUrl: payload.imagenUrl,
        notas: payload.notas,
      },
    });

    for (const variante of payload.variantes) {
      await createVariant(tx, {
        productoId: producto.id,
        categoriaNombre: categoria.nombre,
        categoriaCodigo: categoryCode,
        marca: payload.marca,
        variante,
        usuarioId,
      });
    }

    const refreshed = await tx.producto.findUniqueOrThrow({
      where: { id: producto.id },
      include: productoInclude,
    });

    await tx.producto.update({
      where: { id: producto.id },
      data: {
        estado: buildProductState(refreshed.variantes),
      },
    });

    return mapProductSummary(
      await tx.producto.findUniqueOrThrow({
        where: { id: producto.id },
        include: productoInclude,
      })
    );
  });
}

export async function updateProducto(id: string, payload: ProductoPayload, usuarioId?: string) {
  const prisma = prismaClient();
  const current = await prisma.producto.findUnique({
    where: { id },
    include: productoInclude,
  });

  if (!current) {
    throw new AppError('El producto no existe.', 404);
  }

  const categoria = await assertCategoriaExists(payload.categoriaId);
  const categoryCode = categoria.codigo || payload.categoriaCodigo;

  if (!categoryCode) {
    throw new AppError(
      'La categoria seleccionada no tiene codigo numerico configurado. Edita la categoria y asignale 2 digitos.',
      400
    );
  }

  const incomingIds = new Set(payload.variantes.map((variante) => variante.id).filter(Boolean));
  const removedVariants = current.variantes.filter((variante) => !incomingIds.has(variante.id));

  if (removedVariants.length > 0) {
    throw new AppError(
      'Por ahora no se permite eliminar variantes existentes desde este formulario. Ajustalas o inactivalas.',
      409
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.producto.update({
      where: { id },
      data: {
        categoriaId: payload.categoriaId,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        marca: payload.marca,
        genero: payload.genero,
        imagenUrl: payload.imagenUrl,
        notas: payload.notas,
      },
    });

    for (const variante of payload.variantes) {
      if (!variante.id) {
        await createVariant(tx, {
          productoId: id,
          categoriaNombre: categoria.nombre,
          categoriaCodigo: categoryCode,
          marca: payload.marca,
          variante,
          usuarioId,
        });
        continue;
      }

      const existing = current.variantes.find((item) => item.id === variante.id);

      if (!existing) {
        throw new AppError('Una de las variantes a editar ya no existe.', 404);
      }

      const sku = await buildNextSku(tx, {
        categoriaNombre: categoria.nombre,
        marca: payload.marca,
        color: variante.color,
        talla: variante.talla,
        currentSku: existing.sku,
      });
      const currentPrincipalCode = existing.codigos.find((item: any) => item.principal);
      const codigo = await buildNextBarcode(tx, categoryCode, currentPrincipalCode?.codigo);
      const nextState = buildVariantState(variante);

      await tx.productoVariante.update({
        where: { id: variante.id },
        data: {
          talla: variante.talla,
          color: variante.color,
          sku,
          costoPromedio: variante.costoPromedio,
          precioVenta: variante.precioVenta,
          stockActual: variante.stockActual,
          stockMinimo: variante.stockMinimo,
          estado: nextState,
          permiteDecimal: variante.permiteDecimal,
        },
      });

      if (codigo !== currentPrincipalCode?.codigo) {
        await tx.codigoProducto.updateMany({
          where: { varianteId: variante.id },
          data: { principal: false },
        });

        if (currentPrincipalCode) {
          await tx.codigoProducto.update({
            where: { id: currentPrincipalCode.id },
            data: {
              codigo,
              principal: true,
              tipo: TipoCodigoProducto.BARRAS,
            },
          });
        } else {
          await tx.codigoProducto.create({
            data: {
              varianteId: variante.id,
              codigo,
              principal: true,
              tipo: TipoCodigoProducto.BARRAS,
            },
          });
        }
      }

      const stockDelta = variante.stockActual - existing.stockActual;

      if (stockDelta !== 0) {
        await tx.movimientoInventario.create({
          data: {
            varianteId: variante.id,
            usuarioId,
            tipo:
              stockDelta > 0
                ? TipoMovimientoInventario.AJUSTE_ENTRADA
                : TipoMovimientoInventario.AJUSTE_SALIDA,
            cantidad: Math.abs(stockDelta),
            stockAnterior: existing.stockActual,
            stockPosterior: variante.stockActual,
            costoUnitario: variante.costoPromedio,
            precioUnitario: variante.precioVenta,
            detalle: 'Ajuste manual de inventario desde el panel de productos',
            referenciaTipo: 'PRODUCTO_VARIANTE',
            referenciaId: variante.id,
          },
        });
      }
    }

    const refreshed = await tx.producto.findUniqueOrThrow({
      where: { id },
      include: productoInclude,
    });

    await tx.producto.update({
      where: { id },
      data: {
        estado: buildProductState(refreshed.variantes),
      },
    });

    return mapProductSummary(
      await tx.producto.findUniqueOrThrow({
        where: { id },
        include: productoInclude,
      })
    );
  });
}

export async function updateProductoEstado(id: string, estado: EstadoProducto) {
  await getProductoById(id);

  return mapProductSummary(
    await prismaClient().producto.update({
      where: { id },
      data: { estado },
      include: productoInclude,
    })
  );
}
