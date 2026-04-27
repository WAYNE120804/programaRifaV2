import { EstadoProducto, GeneroProducto } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';

type ProductoVarianteInput = {
  id?: unknown;
  talla?: unknown;
  color?: unknown;
  costoPromedio?: unknown;
  precioVenta?: unknown;
  stockActual?: unknown;
  stockMinimo?: unknown;
  estado?: unknown;
  permiteDecimal?: unknown;
};

type ProductoInput = {
  categoriaId?: unknown;
  categoriaCodigo?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  marca?: unknown;
  genero?: unknown;
  usaVariantes?: unknown;
  estado?: unknown;
  imagenUrl?: unknown;
  notas?: unknown;
  variantes?: unknown;
};

export type ProductoVariantePayload = {
  id: string | null;
  talla: string;
  color: string;
  costoPromedio: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  estado: EstadoProducto;
  permiteDecimal: boolean;
};

export type ProductoPayload = {
  categoriaId: string;
  categoriaCodigo: string | null;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  genero: GeneroProducto;
  usaVariantes: boolean;
  estado: EstadoProducto;
  imagenUrl: string | null;
  notas: string | null;
  variantes: ProductoVariantePayload[];
};

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const NOT_APPLICABLE = 'NO APLICA';

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseCategoriaCodigo(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/\D+/g, '');

  if (!normalized) {
    return null;
  }

  return normalized.padStart(2, '0').slice(0, 2);
}

function parseNumberValue(value: unknown, fieldName: string, defaultValue = 0) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new AppError(`El campo "${fieldName}" debe ser numerico.`);
  }

  return parsed;
}

function parseIntValue(value: unknown, fieldName: string, defaultValue = 0) {
  const parsed = parseNumberValue(value, fieldName, defaultValue);

  if (parsed < 0) {
    throw new AppError(`El campo "${fieldName}" no puede ser negativo.`);
  }

  return Math.trunc(parsed);
}

function parseBoolean(value: unknown, defaultValue = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return defaultValue;
}

function parseEstado(value: unknown) {
  if (typeof value === 'string' && value in EstadoProducto) {
    return value as EstadoProducto;
  }

  return EstadoProducto.ACTIVO;
}

function parseGenero(value: unknown) {
  if (typeof value === 'string' && value in GeneroProducto) {
    return value as GeneroProducto;
  }

  return GeneroProducto.UNISEX;
}

function parseTalla(value: unknown) {
  const talla = parseRequiredString(value, 'talla').toUpperCase();

  if (talla === NOT_APPLICABLE) {
    return NOT_APPLICABLE;
  }

  if (LETTER_SIZES.includes(talla)) {
    return talla;
  }

  if (/^\d{1,3}$/.test(talla)) {
    return talla;
  }

  throw new AppError(
    'La talla debe ser uno de estos valores: XS, S, M, L, XL, XXL, XXXL o un numero como 6, 8, 10, 28, 36.'
  );
}

function parseColor(value: unknown) {
  const color = parseRequiredString(value, 'color');
  return color.toUpperCase() === NOT_APPLICABLE ? NOT_APPLICABLE : color;
}

function parseVariante(
  input: ProductoVarianteInput,
  index: number,
  usaVariantes: boolean
): ProductoVariantePayload {
  return {
    id: parseOptionalString(input.id),
    talla: usaVariantes ? parseTalla(input.talla) : NOT_APPLICABLE,
    color: usaVariantes ? parseColor(input.color) : NOT_APPLICABLE,
    costoPromedio: parseNumberValue(input.costoPromedio, `variantes[${index}].costoPromedio`, 0),
    precioVenta: parseNumberValue(input.precioVenta, `variantes[${index}].precioVenta`, 0),
    stockActual: parseIntValue(input.stockActual, `variantes[${index}].stockActual`, 0),
    stockMinimo: parseIntValue(input.stockMinimo, `variantes[${index}].stockMinimo`, 0),
    estado: parseEstado(input.estado),
    permiteDecimal: parseBoolean(input.permiteDecimal, false),
  };
}

export function parseProductoPayload(input: ProductoInput): ProductoPayload {
  if (!Array.isArray(input.variantes) || input.variantes.length === 0) {
    throw new AppError('Debes agregar al menos una variante al producto.');
  }

  const usaVariantes = parseBoolean(input.usaVariantes, true);

  const variantes = input.variantes.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(`La variante ${index + 1} no es valida.`);
    }

    return parseVariante(item as ProductoVarianteInput, index, usaVariantes);
  });

  const seen = new Set<string>();

  for (const variante of variantes) {
    const key = `${variante.color.trim().toLowerCase()}::${variante.talla}`;

    if (seen.has(key)) {
      throw new AppError(
        `La combinacion color "${variante.color}" y talla "${variante.talla}" esta repetida en el formulario.`
      );
    }

    seen.add(key);
  }

  return {
    categoriaId: parseRequiredString(input.categoriaId, 'categoriaId'),
    categoriaCodigo: parseCategoriaCodigo(input.categoriaCodigo),
    nombre: parseRequiredString(input.nombre, 'nombre'),
    descripcion: parseOptionalString(input.descripcion),
    marca: parseOptionalString(input.marca),
    genero: parseGenero(input.genero),
    usaVariantes,
    estado: parseEstado(input.estado),
    imagenUrl: parseOptionalString(input.imagenUrl),
    notas: parseOptionalString(input.notas),
    variantes,
  };
}
